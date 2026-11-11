import { z } from "zod";
import { applyChange, toMinutes } from "./outfitState";
import { moodFor, resolveClashes, ruleEngine } from "./ruleEngine";
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

  const changes = repairChanges(loose.data.changes ?? [], base, summary, repairs);

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
  }
  let monkeyLine = capText(cleanText(loose.data.monkeyLine), LIMITS.monkeyLine);
  if (!monkeyLine) {
    monkeyLine = reference.monkeyLine;
    repairs.push("monkeyLine");
  }

  if (repairs.length > LIMITS.maxRepairs) return null;
  return { plan: { headline, monkeyLine, mood, base, changes }, repairs };
}
