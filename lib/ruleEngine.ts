import { MONKEY_LINES, pick, STEADY_HEADLINES } from "./lines";
import { applyChange } from "./outfitState";
import type { Change, DaySummary, HourPoint, OutfitPlan, Profile } from "./schema";
import { findClash, ITEM_LABEL, ITEM_SLOT, type ItemId, type Mood, type OutfitState, type Slot } from "./wardrobe";

/** Thresholds (feels-like °C after the profile shift). Tuned by looking at the 7 fixtures. */
export const BAND = { hot: 27, warm: 21, mild: 15, cool: 9, cold: 3 } as const;
export const SENSITIVITY_SHIFT: Record<Profile["sensitivity"], number> = { cold: -3, normal: 0, warm: 3 };
export const CYCLING_CHILL = 2;
export const RAIN_PROB = 60;
export const UMBRELLA_MAX_WIND = 35;
export const RAINBOOTS_MIN_MM = 5;
export const UV_HIGH = 6;
export const SCARF_WIND = 20;
export const WINDPROOF_WIND = 25;
export const WINDY_MOOD = 35;
export const MAX_CHANGES = 4;

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

export function effectiveTemp(p: Pick<HourPoint, "feelsLikeC">, profile: Profile): number {
  return p.feelsLikeC + SENSITIVITY_SHIFT[profile.sensitivity] - (profile.getAround === "cycling" ? CYCLING_CHILL : 0);
}

export const isRainy = (p: HourPoint): boolean => p.rainProb >= RAIN_PROB;
export const isSnowy = (p: HourPoint): boolean => SNOW_CODES.has(p.weatherCode);

function byTemperature(e: number, p: HourPoint, profile: Profile): OutfitState {
  const smart = profile.style === "smart";
  if (e >= BAND.hot) {
    return { top: "tshirt", bottom: smart && e < 30 ? "trousers" : "shorts", footwear: !smart && p.rainProb < 30 ? "sandals" : "sneakers" };
  }
  if (e >= BAND.warm) {
    return { top: "tshirt", bottom: !smart && e >= 23 ? "shorts" : "trousers", footwear: "sneakers" };
  }
  if (e >= BAND.mild) {
    return { top: "longsleeve", outer: "lightjacket", bottom: "trousers", footwear: smart ? "boots" : "sneakers" };
  }
  if (e >= BAND.cool) {
    const top: ItemId = profile.getAround === "transit" ? "longsleeve" : smart ? "sweater" : "hoodie";
    return {
      top,
      outer: "lightjacket",
      bottom: "trousers",
      footwear: smart ? "boots" : "sneakers",
      ...(p.windKmh >= SCARF_WIND ? { neck: "scarf" as const } : {}),
    };
  }
  const cold: OutfitState = { top: "sweater", outer: "puffer", bottom: "trousers", footwear: "boots", head: "beanie", neck: "scarf" };
  return e < BAND.cold ? { ...cold, hands: "gloves" } : cold;
}

/** Make any state wearable: resolve clashes with the warmer/safer option. */
export function resolveClashes(state: OutfitState): OutfitState {
  let s = { ...state };
  for (let guard = 0; guard < 6; guard++) {
    const clash = findClash(s);
    if (!clash) return s;
    const [a, b] = clash;
    const pair = `${a}+${b}`;
    if (pair === "puffer+shorts" || pair === "shorts+gloves") s = { ...s, bottom: "trousers" };
    else if (pair === "puffer+sandals" || pair === "sandals+beanie" || pair === "sandals+gloves") s = { ...s, footwear: "boots" };
    else if (pair === "sunhat+scarf") s = { ...s, head: "beanie" };
    else return s;
  }
  return s;
}

export interface DayContext {
  heavyRain: boolean;
}

/** The ideal outfit for one 2-hour point. */
export function targetAt(p: HourPoint, profile: Profile, day: DayContext): OutfitState {
  const e = effectiveTemp(p, profile);
  let s = byTemperature(e, p, profile);

  if (profile.getAround === "cycling" && p.windKmh >= WINDPROOF_WIND && !s.outer && e < 24) {
    s = { ...s, outer: "lightjacket" };
  }
  if (isSnowy(p) && s.footwear !== "boots") s = { ...s, footwear: "boots" };

  if (isRainy(p) && !isSnowy(p)) {
    const umbrellaOk = p.windKmh < UMBRELLA_MAX_WIND && profile.getAround !== "cycling";
    if (umbrellaOk) s = { ...s, carry: "umbrella" };
    else if (!(s.outer === "puffer" && e < BAND.cold)) s = { ...s, outer: "raincoat" };
    if (day.heavyRain) s = { ...s, footwear: "rainboots" };
    else if (s.footwear === "sandals") s = { ...s, footwear: "sneakers" };
  }

  if (p.uv >= UV_HIGH && p.isDay) {
    s = { ...s, eyes: "sunglasses" };
    if (!s.head) s = { ...s, head: profile.style === "smart" || e >= BAND.hot ? "sunhat" : "cap" };
  }
  return resolveClashes(s);
}

export function moodFor(p: HourPoint, profile: Profile): Mood {
  const e = effectiveTemp(p, profile);
  if (isRainy(p) || isSnowy(p)) return e < 2 && isSnowy(p) ? "shivering" : "soggy";
  if (e < 6) return "shivering";
  if (e >= BAND.hot) return "sweaty";
  if (p.windKmh >= WINDY_MOOD) return "windblown";
  return "happy";
}

const RAIN_ITEMS = new Set<ItemId>(["umbrella", "raincoat", "rainboots"]);

function holdNeeded(slot: Slot, from: ItemId | undefined, to: ItemId | undefined): number {
  if (slot === "carry") return 1;
  if ((to && RAIN_ITEMS.has(to)) || (from && RAIN_ITEMS.has(from))) return 1;
  return 2;
}

function significance(c: Change, stateBefore: OutfitState, base: OutfitState): number {
  if (c.item === "rainboots") return base.footwear === "boots" ? 3 : 7;
  if (RAIN_ITEMS.has(c.item)) return c.action === "add" ? 10 : 6;
  if (c.action === "remove" && (c.item === "sunglasses" || c.item === "cap" || c.item === "sunhat")) return 1;
  const slot = ITEM_SLOT[c.item];
  if (slot === "outer") return 8;
  if (slot === "eyes" || c.item === "cap" || c.item === "sunhat") return 5;
  if (slot === "head" || slot === "neck" || slot === "hands") return 4;
  if (slot === "top") return stateBefore.outer ? 2 : 6;
  if (slot === "bottom") return 3;
  return 2;
}

function reasonFor(c: Change, p: HourPoint, prev: HourPoint, profile: Profile): string {
  const e = Math.round(effectiveTemp(p, profile));
  const warmer = effectiveTemp(p, profile) > effectiveTemp(prev, profile);
  if (c.item === "umbrella" || c.item === "raincoat" || c.item === "rainboots") {
    return c.action === "add" ? `rain from ${p.time}` : "rain clears";
  }
  if (c.item === "sunglasses" || c.item === "cap" || c.item === "sunhat") {
    return c.action === "add" ? `UV ${Math.round(p.uv)} around ${p.time}` : "sun's lower";
  }
  return `${warmer ? "warming up" : "cooling down"} to ${e}°`;
}

/** Walk the day, emit changes at stable crossings, keep the most significant four. */
export function planChanges(summary: DaySummary, profile: Profile, base: OutfitState): Change[] {
  const day: DayContext = { heavyRain: summary.totalRainMm >= RAINBOOTS_MIN_MM };
  const pts = summary.hours;
  const targets = pts.map((p) => targetAt(p, profile, day));
  const raw: Array<Change & { score: number }> = [];
  let cur: OutfitState = { ...base };

  for (let i = 1; i < pts.length; i++) {
    const slots = new Set([...Object.keys(cur), ...Object.keys(targets[i])] as Slot[]);
    for (const slot of slots) {
      const want = targets[i][slot];
      const have = cur[slot];
      if (want === have) continue;
      const need = holdNeeded(slot, have, want);
      if (i + need - 1 >= pts.length) continue;
      const holds = targets.slice(i, i + need).every((t) => t[slot] === want);
      if (!holds) continue;
      const change: Change = want
        ? { time: pts[i].time, action: "add", item: want, reason: "" }
        : { time: pts[i].time, action: "remove", item: have as ItemId, reason: "" };
      const next = applyChange(cur, change);
      if (findClash(next)) continue;
      const reason = reasonFor(change, pts[i], pts[i - 1], profile);
      raw.push({ ...change, reason, score: significance(change, cur, base) });
      cur = next;
    }
  }

  const kept = [...raw]
    .sort((a, b) => b.score - a.score || a.time.localeCompare(b.time))
    .slice(0, MAX_CHANGES)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Re-simulate so every kept change still makes sense on its own.
  const out: Change[] = [];
  let s: OutfitState = { ...base };
  for (const { score: _score, ...c } of kept) {
    const slot = ITEM_SLOT[c.item];
    if (c.action === "add" && s[slot] === c.item) continue;
    if (c.action === "remove" && s[slot] !== c.item) continue;
    const next = applyChange(s, c);
    if (findClash(next)) continue;
    out.push(c);
    s = next;
  }
  return out;
}

function headlineFor(base: OutfitState, changes: Change[], mood: Mood, seed: string): string {
  if (changes.length === 0) return pick(STEADY_HEADLINES[mood], seed);
  const lead = base.outer ?? base.top ?? "tshirt";
  const rank = (c: Change) => (c.action !== "add" ? 0 : c.item === "umbrella" || c.item === "raincoat" ? 3 : c.item === "rainboots" ? 2 : 1);
  const key = [...changes].sort((a, b) => rank(b) - rank(a))[0];
  const leadLabel = ITEM_LABEL[lead].replace(/^./, (m) => m.toUpperCase());
  const what = key.action === "add" ? ITEM_LABEL[key.item] : `lose the ${ITEM_LABEL[key.item]}`;
  const text = `${leadLabel} now, ${what} at ${key.time}.`;
  return text.length <= 60 ? text : `${leadLabel} now. Changes later.`;
}

/** Same input and output as the AI path: a full outfit plan (without `source`). */
export function ruleEngine(summary: DaySummary, profile: Profile): OutfitPlan {
  const day: DayContext = { heavyRain: summary.totalRainMm >= RAINBOOTS_MIN_MM };
  const first = summary.hours[0];
  const base = targetAt(first, profile, day);
  const changes = planChanges(summary, profile, base);
  const mood = moodFor(first, profile);
  const seed = `${summary.dateISO}|${summary.placeLabel}`;
  return {
    headline: headlineFor(base, changes, mood, seed),
    monkeyLine: pick(MONKEY_LINES[mood], seed),
    mood,
    base,
    changes,
  };
}
