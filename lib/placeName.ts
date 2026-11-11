import { z } from "zod";
import { sanitizePlaceLabel } from "./weather";

/**
 * Turn "Use my location" coordinates into a town name, from the visitor's own browser.
 * BigDataCloud's free client-side reverse geocoder (no key; meant for calls from end-user
 * devices). Coordinates are rounded to ~1 km first. If it is slow or fails, we keep
 * "Your location": the name is nice to have, never worth blocking the forecast for.
 */
export const REVERSE_GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";
export const PLACE_NAME_TIMEOUT_MS = 2_500;
export const FALLBACK_PLACE_LABEL = "Your location";

const ResponseSchema = z.object({
  city: z.string().optional(),
  locality: z.string().optional(),
  principalSubdivision: z.string().optional(),
});

const round2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

export function reverseGeocodeUrl(lat: number, lon: number): string {
  const p = new URLSearchParams({
    latitude: round2(lat),
    longitude: round2(lon),
    localityLanguage: "en",
  });
  return `${REVERSE_GEOCODE_URL}?${p.toString()}`;
}

/** Best name for a place: the city, else the locality, else the region. */
export function pickPlaceName(data: unknown): string | null {
  const parsed = ResponseSchema.safeParse(data);
  if (!parsed.success) return null;
  const { city, locality, principalSubdivision } = parsed.data;
  const name = [city, locality, principalSubdivision].find((n) => n && n.trim());
  if (!name) return null;
  const clean = sanitizePlaceLabel(name);
  return clean === FALLBACK_PLACE_LABEL ? null : clean;
}

/** Never throws: resolves to a town name, or "Your location" after a failure or timeout. */
export async function placeNameFor(lat: number, lon: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PLACE_NAME_TIMEOUT_MS);
  try {
    const res = await fetch(reverseGeocodeUrl(lat, lon), { signal: controller.signal });
    if (!res.ok) return FALLBACK_PLACE_LABEL;
    return pickPlaceName(await res.json()) ?? FALLBACK_PLACE_LABEL;
  } catch {
    // Offline, blocked, slow or bad JSON: the forecast still works without a name.
    return FALLBACK_PLACE_LABEL;
  } finally {
    clearTimeout(timer);
  }
}
