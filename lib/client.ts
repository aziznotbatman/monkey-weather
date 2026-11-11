"use client";

import { z } from "zod";
import { ProfileSchema, DEFAULT_PROFILE, type Profile } from "./schema";
import { defaultUnitsForLocale } from "./units";

/** Everything here lives in localStorage only. Every access is wrapped: the app works without it. */
const KEYS = { profile: "mw:profile", place: "mw:place" } as const;

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full, disabled or private mode: carry on without it */
  }
}

export function loadProfile(): Profile {
  const parsed = ProfileSchema.safeParse(read(KEYS.profile));
  if (parsed.success) return parsed.data;
  const locale = typeof navigator !== "undefined" ? navigator.language : undefined;
  let timeZone: string | undefined;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }
  return { ...DEFAULT_PROFILE, units: defaultUnitsForLocale(locale, timeZone) };
}

export const saveProfile = (p: Profile) => write(KEYS.profile, p);

export const SavedPlaceSchema = z.object({
  label: z.string().max(80),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  fromGeolocation: z.boolean().optional(),
  /** Demo scenario id (never saved). */
  demo: z.string().max(30).optional(),
});
export type SavedPlace = z.infer<typeof SavedPlaceSchema>;

export function loadPlace(): SavedPlace | null {
  const parsed = SavedPlaceSchema.safeParse(read(KEYS.place));
  return parsed.success ? parsed.data : null;
}

/** Geolocated coordinates are rounded to ~1 km before they are stored locally. */
export function savePlace(p: SavedPlace): void {
  write(KEYS.place, {
    ...p,
    latitude: Math.round(p.latitude * 100) / 100,
    longitude: Math.round(p.longitude * 100) / 100,
  });
}
