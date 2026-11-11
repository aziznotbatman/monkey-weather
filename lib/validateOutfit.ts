import { z } from "zod";
import { MONKEY_LINES, pick } from "./lines";
import { applyChange, outfitAt, toMinutes } from "./outfitState";
import { headlineFor, moodFor, resolveClashes, ruleEngine } from "./ruleEngine";
import type { Change, DaySummary, OutfitPlan, Profile } from "./schema";
import {
  findClash,
  ITEM_IDS,
  ITEM_SLOT,
  MOODS,
  REQUIRED_SLOTS,
  SLOTS,
  type ItemId,
  type Mood,
  type OutfitState,
  type Slot,
} from "./wardrobe";

export const LIMITS = {
  headline: 60,
  monkeyLine: 120,
  reason: 60,
  changes: 4,
  maxRepairs: 6,
} as const;

const LooseSchema = z.object({
  headline: z.unknown(),
  monkeyLine: z.unknown(),
  mood: z.unknown(),
  base: z.record(z.string(), z.unknown()),
  changes: z.array(z.unknown()).optional(),
});

const isItem = (v: unknown): v is ItemId =>
  typeof v === "string" && (ITEM_IDS as string[]).includes(v);
const isSlot = (v: string): v is Slot => (SLOTS as readonly string[]).includes(v);

/** Strip control characters, emoji and markup-ish characters; collapse whitespace. */
export function cleanText(v: unknown): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[\p{Extended_Pictographic}️]/gu, "")
    .replace(/[<>{}[\]`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cut to `max` characters on a word boundary. */
export function capText(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}

export interface ValidationResult {
  plan: OutfitPlan;
  repairs: string[];
}

function repairBase(
  raw: Record<string, unknown>,
  fallback: OutfitState,
  repairs: string[],
): OutfitState | null {
  let base: OutfitState = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined) continue;
    if (!isSlot(key) || !isItem(value)) {
      repairs.push(`dropped unknown ${key}=${String(value).slice(0, 20)}`);
      continue;
    }
    const slot = ITEM_SLOT[value];
    if (slot === key) base = { ...base, [slot]: value };
    else if (!base[slot] && !raw[slot]) {
      base = { ...base, [slot]: value };
      repairs.push(`moved ${value} to ${slot}`);
    } else repairs.push(`dropped misplaced ${value}`);
  }
  const missing = REQUIRED_SLOTS.filter((s) => !base[s]);
  if (missing.length >= 2) return null;
  for (const s of missing) {
    base = { ...base, [s]: fallback[s] };
    repairs.push(`filled ${s}`);
  }
  if (findClash(base)) {
    base = resolveClashes(base);
    repairs.push("resolved clash in base");
  }
  return base;
}

function repairChanges(
  raw: unknown[],
  base: OutfitState,
  summary: DaySummary,
  repairs: string[],
): Change[] {
  const start = toMinutes(summary.hours[0].time);
  const end = toMinutes(summary.hours[summary.hours.length - 1].time) + 59;
  const parsed = raw
    .map((c) =>
      z
        .object({
          time: z.string(),
          action: z.enum(["add", "remove"]),
          item: z.string(),
          reason: z.unknown(),
        })
        .safeParse(c),
    )
    .flatMap((r) => (r.success ? [r.data] : (repairs.push("dropped malformed change"), [])))
    .filter((c) => {
      const ok =
        /^([01]\d|2[0-3]):[0-5]\d$/.test(c.time) &&
        isItem(c.item) &&
        toMinutes(c.time) > start &&
        toMinutes(c.time) <= end;
      if (!ok) repairs.push(`dropped change ${c.item}@${c.time}`);
      return ok;
    })
    .map((c) => ({ ...c, time: `${c.time.slice(0, 2)}:00` }))
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

  const out: Change[] = [];
  let state = { ...base };
  const seen = new Set<string>();
  for (const c of parsed) {
    const item = c.item as ItemId;
    const slot = ITEM_SLOT[item];
    const key = `${c.time}|${item}`;
    const invalid =
      seen.has(key) ||
      (c.action === "add" && state[slot] === item) ||
      (c.action === "remove" && (state[slot] !== item || REQUIRED_SLOTS.includes(slot)));
    if (invalid) {
      repairs.push(`dropped inconsistent ${c.action} ${item}`);
      continue;
    }
    const next = applyChange(state, { action: c.action, item });
    if (findClash(next)) {
      repairs.push(`dropped clashing ${item}`);
      continue;
    }
    if (out.length >= LIMITS.changes) {
      repairs.push("trimmed to 4 changes");
      break;
    }
    seen.add(key);
    state = next;
    out.push({
      time: c.time,
      action: c.action,
      item,
      reason: capText(cleanText(c.reason) || "the weather shifts", LIMITS.reason),
    });
  }
  return out;
}

/** Letters-only words, with contractions spelled out ("don't" and "do not" match). */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/n['’]t\b/g, " not")
    .replace(/['’]m\b/g, " am")
    .replace(/['’](s|re|ll|ve|d)\b/g, "")
    .split(/[^a-z]+/)
    .filter(Boolean);
}

const HOUSE_LINE_WORDS = Object.values(MONKEY_LINES)
  .flat()
  .map((l) => new Set(words(l)));
/** Share of word overlap above which a line counts as a copy of a house line. */
const COPY_OVERLAP = 0.6;

/** True when the line is one of the prompt's house lines, verbatim or lightly reworded. */
export function isHouseLineCopy(line: string): boolean {
  const mine = new Set(words(line));
  if (mine.size === 0) return false;
  return HOUSE_LINE_WORDS.some((house) => {
    const shared = [...mine].filter((w) => house.has(w)).length;
    return shared / Math.min(mine.size, house.size) >= COPY_OVERLAP;
  });
}

const RAIN_GEAR = new Set<ItemId>(["umbrella", "raincoat"]);

/**
 * Rain guard: when the rule engine puts on rain gear at some time and the checked plan has
 * neither umbrella nor raincoat on at that time, add the rule engine's change back.
 */
function guardRain(
  changes: Change[],
  base: OutfitState,
  reference: readonly Change[],
  repairs: string[],
): Change[] {
  let out = changes;
  for (const ref of reference) {
    if (ref.action !== "add" || !RAIN_GEAR.has(ref.item)) continue;
    const worn = outfitAt(base, out, ref.time);
    if (worn.carry === "umbrella" || worn.outer === "raincoat") continue;
    const kept = out.length >= LIMITS.changes ? out.slice(0, LIMITS.changes - 1) : out;
    const next = [...kept, ref].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
    if (findClash(outfitAt(base, next, ref.time))) continue;
    out = next;
    repairs.push("rain_guard");
  }
  return out;
}

const HOUR_IN_TEXT = /\b\d{2}:00\b/g;

/** With changes, the headline names one of their times; without, it names no time at all. */
export function headlineMatchesChanges(headline: string, changes: Change[]): boolean {
  const times = headline.match(HOUR_IN_TEXT) ?? [];
  if (changes.length === 0) return times.length === 0;
  return times.length > 0 && times.every((t) => changes.some((c) => c.time === t));
}

/**
 * Validate an outfit (from the AI or anywhere else) against the wardrobe rules and
 * repair what can be repaired. Returns null when it is too broken to trust.
 */
export function validateOutfit(
  raw: unknown,
  summary: DaySummary,
  profile: Profile,
): ValidationResult | null {
  const loose = LooseSchema.safeParse(raw);
  if (!loose.success) return null;
  const repairs: string[] = [];
  const reference = ruleEngine(summary, profile);

  const base = repairBase(loose.data.base, reference.base, repairs);
  if (!base) return null;

  const changes = guardRain(
    repairChanges(loose.data.changes ?? [], base, summary, repairs),
    base,
    reference.changes,
    repairs,
  );

  const moodRaw = loose.data.mood;
  let mood: Mood;
  if (typeof moodRaw === "string" && (MOODS as readonly string[]).includes(moodRaw))
    mood = moodRaw as Mood;
  else {
    mood = moodFor(summary.hours[0], profile);
    repairs.push("set mood");
  }

  let headline = capText(cleanText(loose.data.headline), LIMITS.headline);
  if (!headline) {
    headline = reference.headline;
    repairs.push("headline");
  } else if (!headlineMatchesChanges(headline, changes)) {
    // The headline is the instruction ("Puffer jacket now, umbrella at 17:00."): it must name
    // a real change time, or none when the outfit holds all day.
    headline = headlineFor(base, changes, mood, `${summary.dateISO}|${summary.placeLabel}`);
    repairs.push("headline_when");
  }
  let monkeyLine = capText(cleanText(loose.data.monkeyLine), LIMITS.monkeyLine);
  if (!monkeyLine) {
    monkeyLine = reference.monkeyLine;
    repairs.push("monkeyLine");
  } else if (isHouseLineCopy(monkeyLine)) {
    // Copied one of the prompt's example lines: use the day's own house line, so the same
    // line doesn't show up on every cold day.
    monkeyLine = pick(MONKEY_LINES[mood], `${summary.dateISO}|${summary.placeLabel}`);
    repairs.push("monkeyLine_copied");
  }

  if (repairs.length > LIMITS.maxRepairs) return null;
  return { plan: { headline, monkeyLine, mood, base, changes }, repairs };
}
