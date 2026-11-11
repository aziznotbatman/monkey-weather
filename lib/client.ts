"use client";

import { z } from "zod";
import { hashString } from "./lines";
import { ruleEngine } from "./ruleEngine";
import {
  OutfitPlanSchema,
  ProfileSchema,
  DEFAULT_PROFILE,
  type DaySummary,
  type Outfit,
  type Profile,
} from "./schema";
import { defaultUnitsForLocale } from "./units";

/** Everything here lives in localStorage only. Every access is wrapped: the app works without it. */
const KEYS = { profile: "mw:profile", place: "mw:place", last: "mw:last" } as const;
export const LAST_RESULT_TTL_MS = 30 * 60 * 1000;

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

function resultKey(summary: DaySummary, profile: Profile): string {
  const { units: _u, ...rest } = profile;
  return [
    summary.placeLabel,
    summary.dateISO,
    summary.hours[0]?.time,
    JSON.stringify(rest),
    hashString(JSON.stringify(summary.hours)),
  ].join("|");
}

const LastSchema = z.object({
  key: z.string(),
  savedAt: z.number(),
  outfit: OutfitPlanSchema.extend({ source: z.enum(["ai", "fallback"]) }),
});

export type OutfitResult =
  | { ok: true; outfit: Outfit; fromCache: boolean }
  | { ok: false; error: "rate_limited"; retryAfterSec: number };

/**
 * Get the outfit for a summary: reuse a recent result from this device, otherwise ask the
 * server. If the server can't be reached, the same rule engine runs right here in the browser.
 */
export async function getOutfit(
  summary: DaySummary,
  profile: Profile,
  signal?: AbortSignal,
): Promise<OutfitResult> {
  const key = resultKey(summary, profile);
  const last = LastSchema.safeParse(read(KEYS.last));
  if (
    last.success &&
    last.data.key === key &&
    Date.now() - last.data.savedAt < LAST_RESULT_TTL_MS
  ) {
    return { ok: true, outfit: last.data.outfit as Outfit, fromCache: true };
  }

  try {
    const res = await fetch("/api/outfit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ summary, profile }),
      signal,
    });
    if (res.status === 429) {
      const body = (await res.json().catch(() => ({}))) as { retryAfterSec?: number };
      return { ok: false, error: "rate_limited", retryAfterSec: body.retryAfterSec ?? 60 };
    }
    if (res.ok) {
      const body = (await res.json()) as { outfit?: unknown };
      const parsed = OutfitPlanSchema.extend({ source: z.enum(["ai", "fallback"]) }).safeParse(
        body.outfit,
      );
      if (parsed.success) {
        const outfit = parsed.data as Outfit;
        // Keep only AI answers: after a fallback (e.g. the model was busy), the next visit
        // should get another chance at the AI.
        if (outfit.source === "ai") write(KEYS.last, { key, savedAt: Date.now(), outfit });
        return { ok: true, outfit, fromCache: false };
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
  }
  // Server unreachable or answered nonsense: the backup brain runs locally.
  return {
    ok: true,
    outfit: { ...ruleEngine(summary, profile), source: "fallback" },
    fromCache: false,
  };
}
