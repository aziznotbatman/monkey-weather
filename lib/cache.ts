import { hashString } from "./lines";
import { PROMPT_VERSION } from "./prompt";
import type { DaySummary, Profile } from "./schema";

/** Tiny in-memory TTL cache (per server instance). */
export function createTtlCache<V>(opts: { ttlMs: number; maxEntries: number }) {
  const store = new Map<string, { value: V; expires: number }>();
  return {
    get(key: string, now: number = Date.now()): V | undefined {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (hit.expires <= now) {
        store.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key: string, value: V, now: number = Date.now()): void {
      store.delete(key);
      store.set(key, { value, expires: now + opts.ttlMs });
      while (store.size > opts.maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
      }
    },
    size: () => store.size,
  };
}

export const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Cache key: normalised place + date + 2-hour bucket of the first step + profile
 * (without display units) + a hash of the compact summary + prompt version.
 */
export function outfitCacheKey(summary: DaySummary, profile: Profile): string {
  const place = summary.placeLabel.toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "");
  const bucket = summary.hours[0]?.time ?? "00:00";
  const p = `${profile.sensitivity}-${profile.getAround}-${profile.style}`;
  const digest = hashString(JSON.stringify(summary.hours)).toString(36);
  return [PROMPT_VERSION, place, summary.dateISO, bucket, p, digest].join("|");
}
