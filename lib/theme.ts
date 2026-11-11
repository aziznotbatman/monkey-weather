import type { HourPoint } from "./schema";
import { sky, type SkyKind } from "./tokens";

const THUNDER = new Set([95, 96, 99]);
const SNOW = new Set([71, 73, 75, 77, 85, 86]);
const RAIN = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const OVERCAST = new Set([3, 45, 48]);
const PARTLY = new Set([1, 2]);

export const WINDY_KMH = 30;

/** Which background a moment of the day gets. */
export function skyFor(p: HourPoint): SkyKind {
  if (THUNDER.has(p.weatherCode)) return "storm";
  if (SNOW.has(p.weatherCode)) return "snow";
  if (RAIN.has(p.weatherCode) || p.rainProb >= 60) return "rain";
  if (!p.isDay) return "night";
  if (p.feelsLikeC <= -2) return "snow";
  if (OVERCAST.has(p.weatherCode)) return "overcast";
  if (PARTLY.has(p.weatherCode)) return "partly";
  return "clear";
}

export function themeFor(kind: SkyKind) {
  return sky[kind];
}

/** WCAG relative luminance of a #RRGGBB colour. */
export function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
