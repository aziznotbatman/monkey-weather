import { isAiConfigured } from "@/lib/env";
import { askModel } from "@/lib/ai";
import { defaultCache, handleOutfitRequest } from "@/lib/outfitService";
import { outfitRateLimit } from "@/lib/ratelimit";

export const maxDuration = 20;

/** Logs only status, duration, source and a short reason. Never bodies, keys or IPs. */
function log(entry: { status: number; ms: number; source?: string; reason?: string }) {
  console.info(JSON.stringify({ route: "/api/outfit", ...entry }));
}

export async function POST(req: Request) {
  return handleOutfitRequest(req, {
    aiConfigured: isAiConfigured,
    askModel,
    rateLimit: (key) => outfitRateLimit(key),
    cache: defaultCache,
    log,
    now: () => Date.now(),
  });
}
