export type Units = "C" | "F";

export function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

/** Format a Celsius value for display in the chosen unit, e.g. "4°" or "39°". */
export function formatTemp(c: number, units: Units): string {
  const v = units === "F" ? cToF(c) : c;
  const rounded = Math.round(v);
  return `${Object.is(rounded, -0) ? 0 : rounded}°`;
}

/** Round to the nearest 0.5. */
export function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/** Countries that use Fahrenheit day to day. */
const FAHRENHEIT_REGIONS = new Set(["US", "LR", "MM", "BS", "BZ", "KY", "PW", "FM", "MH"]);

/**
 * °F only when the locale's region uses Fahrenheit AND the device clock is set to a matching
 * timezone (many Europeans run browsers in en-US). Everyone else gets °C.
 */
export function defaultUnitsForLocale(locale: string | undefined, timeZone?: string): Units {
  if (!locale) return "C";
  const region = locale.split(/[-_]/)[1]?.toUpperCase();
  if (!region || !FAHRENHEIT_REGIONS.has(region)) return "C";
  if (timeZone && !/^(America|Pacific|US)\//.test(timeZone)) return "C";
  return "F";
}
