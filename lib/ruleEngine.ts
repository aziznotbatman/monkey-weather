import {
  dayCondition,
  isGusty,
  isMuggy,
  isWindy,
  precipAt,
  type DayCondition,
  type Precip,
} from "./conditions";
import {
  CONDITION_HEADLINES,
  CONDITION_LINES,
  MONKEY_LINES,
  pick,
  STEADY_HEADLINES,
} from "./lines";
import { applyChange } from "./outfitState";
import type { Change, DaySummary, HourPoint, OutfitPlan, Profile } from "./schema";
import {
  findClash,
  ITEM_LABEL,
  ITEM_SLOT,
  type ItemId,
  type Mood,
  type OutfitState,
  type Slot,
} from "./wardrobe";

/**
 * The outfit engine: a hand-written rule system (an "expert system"). Same input, same
 * answer, every time. Thresholds are feels-like °C after the profile shift.
 */
export const BAND = { hot: 27, warm: 21, mild: 15, cool: 9, cold: 3 } as const;
export const SENSITIVITY_SHIFT: Record<Profile["sensitivity"], number> = {
  cold: -3,
  normal: 0,
  warm: 3,
};
export const CYCLING_CHILL = 2;
export const RAINBOOTS_MIN_MM = 5;
export const UV_HIGH = 6;
export const SCARF_WIND = 20;
export const WINDPROOF_WIND = 25;
/** Below this, snow or icy weather gets gloves even when the temperature alone wouldn't. */
export const SNOW_GLOVES_C = 5;
/** Sandals only when the chance of rain stays under this. */
export const SANDALS_MAX_RAIN = 30;
export const MAX_CHANGES = 4;

export function effectiveTemp(p: Pick<HourPoint, "feelsLikeC">, profile: Profile): number {
  return (
    p.feelsLikeC +
    SENSITIVITY_SHIFT[profile.sensitivity] -
    (profile.getAround === "cycling" ? CYCLING_CHILL : 0)
  );
}

const WET: ReadonlySet<Precip> = new Set(["drizzle", "rain", "downpour", "sleet", "storm"]);
const ICY: ReadonlySet<Precip> = new Set(["snow", "sleet", "freezing"]);

export const isRainy = (p: HourPoint): boolean =>
  WET.has(precipAt(p)) || precipAt(p) === "freezing";
export const isSnowy = (p: HourPoint): boolean => precipAt(p) === "snow";

/** Base layers by temperature band, style and how the person gets around. */
function byTemperature(e: number, p: HourPoint, profile: Profile): OutfitState {
  const smart = profile.style === "smart";
  const cycling = profile.getAround === "cycling";
  const windy = isWindy(p) || p.windKmh >= WINDPROOF_WIND;

  if (e >= BAND.hot) {
    return {
      top: smart ? "shirt" : "tshirt",
      bottom: smart && e < 30 ? "trousers" : "shorts",
      footwear: !smart && p.rainProb < SANDALS_MAX_RAIN ? "sandals" : "sneakers",
      carry: "bottle",
    };
  }
  if (e >= BAND.warm) {
    return {
      top: smart ? "shirt" : "tshirt",
      bottom: !smart && e >= 23 ? "shorts" : "trousers",
      footwear: "sneakers",
      ...(isMuggy(p) ? { carry: "bottle" as const } : {}),
    };
  }
  if (e >= BAND.mild) {
    const outer: ItemId = windy
      ? "windbreaker"
      : cycling || profile.sensitivity === "warm"
        ? "vest"
        : "lightjacket";
    return {
      top: smart ? "shirt" : "longsleeve",
      outer,
      bottom: "trousers",
      footwear: smart ? "boots" : "sneakers",
    };
  }
  if (e >= BAND.cool) {
    const top: ItemId =
      profile.getAround === "transit" ? "longsleeve" : smart ? "sweater" : "hoodie";
    return {
      top,
      outer: windy || cycling ? "windbreaker" : "lightjacket",
      bottom: "trousers",
      footwear: smart ? "boots" : "sneakers",
      ...(p.windKmh >= SCARF_WIND ? { neck: "scarf" as const } : {}),
    };
  }
  const cold: OutfitState = {
    top: "sweater",
    outer: "puffer",
    bottom: "trousers",
    footwear: "boots",
    // Smart dressers keep their hair: ear muffs instead of a beanie.
    head: smart ? "earmuffs" : "beanie",
    neck: "scarf",
  };
  return e < BAND.cold ? { ...cold, hands: "gloves" } : cold;
}

/** Make any state wearable: resolve clashes with the warmer/safer option. */
export function resolveClashes(state: OutfitState): OutfitState {
  let s = { ...state };
  for (let guard = 0; guard < 8; guard++) {
    const clash = findClash(s);
    if (!clash) return s;
    const pair = `${clash[0]}+${clash[1]}`;
    if (pair === "puffer+shorts" || pair === "shorts+gloves" || pair === "earmuffs+shorts")
      s = { ...s, bottom: "trousers" };
    else if (pair === "rainpants+sandals") s = { ...s, footwear: "rainboots" };
    else if (
      pair === "puffer+sandals" ||
      pair === "sandals+beanie" ||
      pair === "sandals+gloves" ||
      pair === "earmuffs+sandals"
    )
      s = { ...s, footwear: "boots" };
    else if (pair === "sunhat+scarf") s = { ...s, head: "beanie" };
    else return s;
  }
  return s;
}

export interface DayContext {
  heavyRain: boolean;
}

/** Rain, sleet, storms, snow and ice on top of the temperature outfit. */
function forPrecip(
  s: OutfitState,
  p: HourPoint,
  e: number,
  profile: Profile,
  day: DayContext,
): OutfitState {
  const kind = precipAt(p);
  if (kind === "none") return s;
  const cycling = profile.getAround === "cycling";
  // No umbrella on a bike, in strong wind or gusts, or under lightning.
  const umbrellaOk = !cycling && !isWindy(p) && kind !== "storm";
  const keepPuffer = s.outer === "puffer" && e < BAND.cool;
  let out = { ...s };

  if (ICY.has(kind)) {
    out = { ...out, footwear: "boots" };
    if (e < SNOW_GLOVES_C) out = { ...out, hands: "gloves" };
    if (!out.head || out.head === "cap" || out.head === "sunhat")
      out = { ...out, head: profile.style === "smart" ? "earmuffs" : "beanie" };
  }
  if (kind === "snow") return out;

  if (kind === "drizzle") {
    if (!keepPuffer) out = { ...out, outer: e >= BAND.cool ? "windbreaker" : "raincoat" };
  } else {
    if (umbrellaOk) out = { ...out, carry: "umbrella" };
    // Storms already rule out the umbrella, so they land here too.
    const needsCoat = !umbrellaOk || kind === "downpour" || kind === "freezing";
    if (needsCoat && !keepPuffer) out = { ...out, outer: "raincoat" };
    if ((day.heavyRain || kind === "downpour") && !ICY.has(kind))
      out = { ...out, footwear: "rainboots" };
    if (
      (cycling && kind !== "freezing") ||
      (kind === "downpour" && profile.getAround === "walking")
    )
      out = { ...out, bottom: "rainpants" };
  }
  if (out.footwear === "sandals") out = { ...out, footwear: "sneakers" };
  if (out.carry === "bottle" && kind !== "drizzle")
    out = { ...out, carry: umbrellaOk ? "umbrella" : undefined };
  return out;
}

/** The ideal outfit for one 2-hour point. */
export function targetAt(p: HourPoint, profile: Profile, day: DayContext): OutfitState {
  const e = effectiveTemp(p, profile);
  let s = forPrecip(byTemperature(e, p, profile), p, e, profile, day);

  if (p.uv >= UV_HIGH && p.isDay) {
    s = { ...s, eyes: "sunglasses" };
    if (!s.head && !isGusty(p))
      s = { ...s, head: profile.style === "smart" || e >= BAND.hot ? "sunhat" : "cap" };
  }
  // Gusts take brimmed hats. Beanies and ear muffs hold on.
  if (isGusty(p) && (s.head === "cap" || s.head === "sunhat")) s = { ...s, head: undefined };
  return resolveClashes(dropEmpty(s));
}

function dropEmpty(s: OutfitState): OutfitState {
  return Object.fromEntries(Object.entries(s).filter(([, v]) => v)) as OutfitState;
}

export function moodFor(p: HourPoint, profile: Profile): Mood {
  const e = effectiveTemp(p, profile);
  const kind = precipAt(p);
  if (kind !== "none") return ICY.has(kind) && e < 2 ? "shivering" : "soggy";
  if (e < 6) return "shivering";
  if (e >= BAND.hot || (isMuggy(p) && e >= BAND.warm + 3)) return "sweaty";
  if (isWindy(p)) return "windblown";
  return "happy";
}

const RAIN_ITEMS = new Set<ItemId>(["umbrella", "raincoat", "rainboots", "rainpants"]);
const SUN_ITEMS = new Set<ItemId>(["sunglasses", "cap", "sunhat"]);

function holdNeeded(slot: Slot, from: ItemId | undefined, to: ItemId | undefined): number {
  if ((to && RAIN_ITEMS.has(to)) || (from && RAIN_ITEMS.has(from))) return 1;
  if (slot === "carry") return to === "umbrella" || from === "umbrella" ? 1 : 2;
  return 2;
}

function significance(c: Change, stateBefore: OutfitState, base: OutfitState): number {
  if (c.item === "rainboots") return base.footwear === "boots" ? 3 : 7;
  if (c.item === "rainpants") return c.action === "add" ? 7 : 4;
  if (RAIN_ITEMS.has(c.item)) return c.action === "add" ? 10 : 6;
  if (c.action === "remove" && SUN_ITEMS.has(c.item)) return 1;
  if (c.item === "bottle") return c.action === "add" ? 3 : 1;
  const slot = ITEM_SLOT[c.item];
  if (slot === "outer") return 8;
  if (slot === "eyes" || c.item === "cap" || c.item === "sunhat") return 5;
  if (slot === "head" || slot === "neck" || slot === "hands") return 4;
  if (slot === "top") return stateBefore.outer ? 2 : 6;
  if (slot === "bottom") return 3;
  return 2;
}

const PRECIP_WORD: Record<Precip, string> = {
  none: "rain",
  drizzle: "drizzle",
  rain: "rain",
  downpour: "downpour",
  freezing: "freezing rain",
  sleet: "sleet",
  snow: "snow",
  storm: "storm",
};

function reasonFor(c: Change, p: HourPoint, prev: HourPoint, profile: Profile): string {
  const e = Math.round(effectiveTemp(p, profile));
  const warmer = effectiveTemp(p, profile) > effectiveTemp(prev, profile);
  const kind = precipAt(p);
  const wet = PRECIP_WORD[kind === "none" ? precipAt(prev) : kind];
  const temp = `${warmer ? "warming up" : "cooling down"} to ${e}°`;

  if (RAIN_ITEMS.has(c.item)) return c.action === "add" ? `${wet} from ${p.time}` : `${wet} clears`;
  if (c.item === "windbreaker" && c.action === "add") {
    if (isGusty(p)) return `gusts to ${p.gustKmh} km/h`;
    if (kind === "drizzle") return `drizzle from ${p.time}`;
    if (p.windKmh >= WINDPROOF_WIND) return `wind up to ${p.windKmh} km/h`;
  }
  if ((c.item === "cap" || c.item === "sunhat") && c.action === "remove" && isGusty(p))
    return `gusts to ${p.gustKmh} km/h`;
  if (SUN_ITEMS.has(c.item))
    return c.action === "add" ? `UV ${Math.round(p.uv)} around ${p.time}` : "sun's lower";
  if (c.item === "bottle")
    return c.action === "add"
      ? isMuggy(p)
        ? `muggy, ${p.humidity}% humidity`
        : `${e}° by ${p.time}`
      : "cooling down";
  if (c.item === "boots" && c.action === "add" && ICY.has(kind)) return `${wet} from ${p.time}`;
  return temp;
}

/** Shoes in order of how much weather they handle. */
const FOOTWEAR_RANK: Partial<Record<ItemId, number>> = {
  sandals: 0,
  sneakers: 1,
  boots: 2,
  rainboots: 3,
};

function mostCommon<T>(xs: T[]): T {
  const counts = new Map<T, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
}

/**
 * People get dressed once. Top, trousers and shoes are chosen for the whole day; only layers
 * and accessories change. Top: the one for the day's middle temperature (outers cover the
 * cold ends). Bottom: the most common choice (rain trousers still go on over it). Shoes: the
 * most weather-proof pair any part of the day needs, if that's rain or ice; else the usual.
 */
export function dayTargets(summary: DaySummary, profile: Profile): OutfitState[] {
  const day: DayContext = { heavyRain: summary.totalRainMm >= RAINBOOTS_MIN_MM };
  const pts = summary.hours;
  const raw = pts.map((p) => targetAt(p, profile, day));

  const byTemp = [...raw.keys()].sort((a, b) => pts[a].feelsLikeC - pts[b].feelsLikeC);
  const top = raw[byTemp[Math.floor(byTemp.length / 2)]].top;
  const bottoms = raw.map((t) => t.bottom).filter((b) => b && b !== "rainpants");
  const bottom = bottoms.length ? mostCommon(bottoms) : raw[0].bottom;
  const shoes = raw.map((t) => t.footwear).filter((f): f is ItemId => Boolean(f));
  const toughest = shoes.reduce((a, b) =>
    (FOOTWEAR_RANK[b] ?? 0) > (FOOTWEAR_RANK[a] ?? 0) ? b : a,
  );
  const weatherShoes = toughest === "rainboots" || raw.some((_, i) => ICY.has(precipAt(pts[i])));
  const footwear = weatherShoes ? toughest : mostCommon(shoes);

  return raw.map((t) =>
    resolveClashes({
      ...t,
      top,
      bottom: t.bottom === "rainpants" ? "rainpants" : bottom,
      footwear,
    }),
  );
}

/** Walk the day, emit changes at stable crossings, keep the most significant four. */
export function planChanges(summary: DaySummary, profile: Profile, base: OutfitState): Change[] {
  const pts = summary.hours;
  const targets = dayTargets(summary, profile);
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

/** "Puffer jacket now, umbrella at 17:00." or, with no changes, a steady-day line. */
export function headlineFor(
  base: OutfitState,
  changes: Change[],
  mood: Mood,
  seed: string,
  condition: DayCondition | null = null,
): string {
  if (changes.length === 0) {
    const steady = condition && condition !== "swing" ? CONDITION_HEADLINES[condition] : null;
    return pick(steady ?? STEADY_HEADLINES[mood], seed);
  }
  const lead = base.outer ?? base.top ?? "tshirt";
  const rank = (c: Change) => {
    if (c.action !== "add") return 0;
    if (c.item === "umbrella" || c.item === "raincoat") return 3;
    if (c.item === "rainboots" || c.item === "rainpants") return 2;
    return 1;
  };
  const key = [...changes].sort((a, b) => rank(b) - rank(a))[0];
  const leadLabel = ITEM_LABEL[lead].replace(/^./, (m) => m.toUpperCase());
  const what = key.action === "add" ? ITEM_LABEL[key.item] : `lose the ${ITEM_LABEL[key.item]}`;
  const text = `${leadLabel} now, ${what} at ${key.time}.`;
  return text.length <= 60 ? text : `${leadLabel} now. Changes later.`;
}

/** The chimp's line: about today's notable weather if there is any, else about his mood. */
export function monkeyLineFor(mood: Mood, condition: DayCondition | null, seed: string): string {
  return pick(condition ? CONDITION_LINES[condition] : MONKEY_LINES[mood], seed);
}

/** The whole plan for a day: base outfit, up to four timed changes, headline and line. */
export function ruleEngine(summary: DaySummary, profile: Profile): OutfitPlan {
  const first = summary.hours[0];
  const base = dayTargets(summary, profile)[0];
  const changes = planChanges(summary, profile, base);
  const mood = moodFor(first, profile);
  const condition = dayCondition(summary);
  const seed = `${summary.dateISO}|${summary.placeLabel}`;
  return {
    headline: headlineFor(base, changes, mood, seed, condition),
    monkeyLine: monkeyLineFor(mood, condition, seed),
    mood,
    base,
    changes,
  };
}
