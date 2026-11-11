import type { DaySummary, HourPoint } from "./schema";

/**
 * What kind of weather a 2-hour step is, from the WMO weather code plus temperature,
 * gusts and humidity. Open-Meteo codes: https://open-meteo.com/en/docs (WMO 4677 subset).
 */
export type Precip =
  "none" | "drizzle" | "rain" | "downpour" | "freezing" | "sleet" | "snow" | "storm";

export const GUSTY_KMH = 50;
export const WINDY_KMH = 35;
export const MUGGY_HUMIDITY = 70;
export const MUGGY_FEELS = 24;
/** Rain heavier than this per 2-hour step counts as a downpour (≈ 2 mm/h). */
export const DOWNPOUR_MM = 4;
/** Rain at or below this air temperature falls as sleet. */
export const SLEET_MAX_C = 1;
/** Chance of rain at which we plan for it even without a rain weather code. */
export const LIKELY_RAIN_PROB = 60;

const DRIZZLE = new Set([51, 53, 55]);
const FREEZING = new Set([56, 57, 66, 67]);
const RAIN = new Set([61, 63, 65, 80, 81, 82]);
const HEAVY_RAIN = new Set([65, 82]);
const SNOW = new Set([71, 73, 75, 77, 85, 86]);
const STORM = new Set([95, 96, 99]);
const FOG = new Set([45, 48]);

export function precipAt(p: HourPoint): Precip {
  const c = p.weatherCode;
  if (STORM.has(c)) return "storm";
  if (FREEZING.has(c)) return "freezing";
  if (SNOW.has(c)) return p.tempC > SLEET_MAX_C + 1 ? "sleet" : "snow";
  if (RAIN.has(c) || DRIZZLE.has(c)) {
    if (p.tempC <= SLEET_MAX_C) return "sleet";
    if (HEAVY_RAIN.has(c) || p.rainMm >= DOWNPOUR_MM) return "downpour";
    return DRIZZLE.has(c) ? "drizzle" : "rain";
  }
  // No precipitation code but a high chance of it (the two fields often disagree): rain.
  if (p.rainProb >= LIKELY_RAIN_PROB) return p.tempC <= SLEET_MAX_C ? "sleet" : "rain";
  return "none";
}

export const isFoggy = (p: HourPoint): boolean => FOG.has(p.weatherCode);
export const isGusty = (p: HourPoint): boolean => p.gustKmh >= GUSTY_KMH;
export const isWindy = (p: HourPoint): boolean => p.windKmh >= WINDY_KMH || isGusty(p);
export const isMuggy = (p: HourPoint): boolean =>
  p.humidity >= MUGGY_HUMIDITY && p.feelsLikeC >= MUGGY_FEELS;

/** The one thing worth talking about today, most dramatic first. */
export type DayCondition =
  | "storm"
  | "freezing"
  | "snow"
  | "sleet"
  | "downpour"
  | "gusty"
  | "muggy"
  | "fog"
  | "drizzle"
  | "swing";

/** Feels-like spread (°C) that makes a day a "swing" day. */
export const SWING_C = 10;

export function dayCondition(summary: DaySummary): DayCondition | null {
  const hs = summary.hours;
  const kinds = new Set(hs.map(precipAt));
  if (kinds.has("storm")) return "storm";
  if (kinds.has("freezing")) return "freezing";
  if (kinds.has("snow")) return "snow";
  if (kinds.has("sleet")) return "sleet";
  if (kinds.has("downpour")) return "downpour";
  if (hs.some(isGusty)) return "gusty";
  if (hs.some(isMuggy)) return "muggy";
  if (hs.some(isFoggy)) return "fog";
  if (kinds.has("drizzle")) return "drizzle";
  if (summary.maxFeelsLikeC - summary.minFeelsLikeC >= SWING_C) return "swing";
  return null;
}
