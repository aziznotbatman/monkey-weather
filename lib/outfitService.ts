import { CACHE_TTL_MS, createTtlCache, outfitCacheKey } from "./cache";
import type { AiFailure } from "./openai";
import { clientIp, type RateLimitResult } from "./ratelimit";
import { ruleEngine } from "./ruleEngine";
import { OutfitRequestSchema, type AiOutfit, type DaySummary, type Outfit, type Profile } from "./schema";
import { validateOutfit } from "./validateOutfit";
import { sanitizePlaceLabel } from "./weather";

export const MAX_BODY_BYTES = 8 * 1024;

export interface OutfitResponseBody {
  outfit: Outfit;
  /** Why the fallback was used (never secret, safe to show). */
  fallbackReason?: AiFailure | "invalid_ai_output";
  cached?: boolean;
}

export interface ErrorBody {
  error: "bad_request" | "forbidden" | "rate_limited" | "too_large";
  retryAfterSec?: number;
}

export interface ServiceDeps {
  aiConfigured: () => boolean;
  askModel: (summary: DaySummary, profile: Profile) => Promise<AiOutfit>;
  rateLimit: (key: string) => RateLimitResult;
  cache: ReturnType<typeof createTtlCache<Outfit>>;
  log: (entry: { status: number; ms: number; source?: string; reason?: string }) => void;
  now: () => number;
}

export const defaultCache = createTtlCache<Outfit>({ ttlMs: CACHE_TTL_MS, maxEntries: 500 });

/** Reject cross-site browser POSTs. Same-origin and non-browser (no Origin) requests pass. */
export function isAllowedOrigin(headers: Headers, selfHost: string | null): boolean {
  const site = headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = headers.get("origin");
  if (!origin) return true;
  try {
    const host = new URL(origin).host;
    if (selfHost && host === selfHost) return true;
    return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  } catch {
    return false;
  }
}

function json(status: number, body: OutfitResponseBody | ErrorBody, extra: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store", ...extra } });
}

export async function handleOutfitRequest(req: Request, deps: ServiceDeps): Promise<Response> {
  const started = deps.now();
  const done = (res: Response, source?: string, reason?: string) => {
    deps.log({ status: res.status, ms: deps.now() - started, source, reason });
    return res;
  };

  if (!isAllowedOrigin(req.headers, req.headers.get("host"))) return done(json(403, { error: "forbidden" }));

  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) return done(json(413, { error: "too_large" }));

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return done(json(413, { error: "too_large" }));
    raw = JSON.parse(text);
  } catch {
    return done(json(400, { error: "bad_request" }));
  }
  const parsed = OutfitRequestSchema.safeParse(raw);
  if (!parsed.success) return done(json(400, { error: "bad_request" }));

  const limit = deps.rateLimit(clientIp(req.headers));
  if (!limit.ok) {
    return done(json(429, { error: "rate_limited", retryAfterSec: limit.retryAfterSec }, { "Retry-After": String(limit.retryAfterSec) }));
  }

  const profile = parsed.data.profile;
  const summary: DaySummary = { ...parsed.data.summary, placeLabel: sanitizePlaceLabel(parsed.data.summary.placeLabel) };
  const key = outfitCacheKey(summary, profile);
  const hit = deps.cache.get(key);
  if (hit) return done(json(200, { outfit: hit, cached: true }), hit.source, "cache");

  const fallback = (reason: OutfitResponseBody["fallbackReason"]) => {
    const outfit: Outfit = { ...ruleEngine(summary, profile), source: "fallback" };
    // Cache fallbacks briefly too: the rule engine is deterministic for the same input.
    if (reason === "no_key") deps.cache.set(key, outfit);
    return done(json(200, { outfit, fallbackReason: reason }), "fallback", reason);
  };

  if (!deps.aiConfigured()) return fallback("no_key");

  let ai: AiOutfit;
  try {
    ai = await deps.askModel(summary, profile);
  } catch (err) {
    const kind = (err as { kind?: AiFailure }).kind ?? "error";
    return fallback(kind);
  }

  const checked = validateOutfit(ai, summary, profile);
  if (!checked) return fallback("invalid_ai_output");

  const outfit: Outfit = { ...checked.plan, source: "ai" };
  deps.cache.set(key, outfit);
  return done(json(200, { outfit }), "ai", checked.repairs.length ? `repaired:${checked.repairs.length}` : undefined);
}
