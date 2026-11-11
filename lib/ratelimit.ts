/**
 * Best-effort in-memory sliding-window rate limiter.
 *
 * Honest caveat: on Vercel each serverless instance has its own memory, and instances come
 * and go, so this only slows down a single noisy client hitting a warm instance. The real
 * backstop is a Vercel Firewall rate-limit rule (see README) plus the OpenAI budget limit.
 */
export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function createRateLimiter(opts: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, number[]>();
  const maxKeys = opts.maxKeys ?? 5000;

  return function check(key: string, now: number = Date.now()): RateLimitResult {
    const since = now - opts.windowMs;
    const recent = (hits.get(key) ?? []).filter((t) => t > since);
    if (recent.length >= opts.limit) {
      hits.set(key, recent);
      const retryAfterSec = Math.max(1, Math.ceil((recent[0] + opts.windowMs - now) / 1000));
      return { ok: false, remaining: 0, retryAfterSec };
    }
    const next = [...recent, now];
    hits.delete(key);
    hits.set(key, next);
    if (hits.size > maxKeys) {
      const oldest = hits.keys().next().value;
      if (oldest !== undefined) hits.delete(oldest);
    }
    return { ok: true, remaining: opts.limit - next.length, retryAfterSec: 0 };
  };
}

export const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 } as const;
export const outfitRateLimit = createRateLimiter(RATE_LIMIT);

/** Client IP as seen by Vercel's proxy. Used only as an in-memory key, never logged or stored. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
