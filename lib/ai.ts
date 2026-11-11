import "server-only";
import OpenAI, { APIError } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { getAiSettings } from "./env";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { AiOutfitSchema, type AiOutfit, type DaySummary, type Profile } from "./schema";

export const AI_TIMEOUT_MS = 12_000;
/** Includes any "thinking" tokens on models that count them as output (Gemini does). */
export const AI_MAX_OUTPUT_TOKENS = 2_000;

export type AiFailure =
  | "no_key"
  | "auth"
  | "bad_request"
  | "timeout"
  | "rate_limited"
  | "server_error"
  | "bad_output"
  | "error";

export class AiError extends Error {
  constructor(public readonly kind: AiFailure) {
    super(kind);
  }
}

let client: OpenAI | null = null;
function getClient(apiKey: string, baseURL: string): OpenAI {
  if (!apiKey) throw new AiError("no_key");
  // Retries are handled below (one, only on 5xx); the SDK's own retries are off.
  client ??= new OpenAI({ apiKey, baseURL, timeout: AI_TIMEOUT_MS, maxRetries: 0 });
  return client;
}

async function callOnce(
  summary: DaySummary,
  profile: Profile,
  signal: AbortSignal,
  useFallbackModel = false,
): Promise<AiOutfit> {
  const settings = getAiSettings();
  const model =
    useFallbackModel && settings.fallbackModel ? settings.fallbackModel : settings.model;
  const completion = await getClient(settings.apiKey, settings.baseURL).chat.completions.parse(
    {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(summary, profile) },
      ],
      max_tokens: AI_MAX_OUTPUT_TOKENS,
      response_format: zodResponseFormat(AiOutfitSchema, "monkey_outfit"),
      ...(settings.reasoningEffort === "off" ? {} : { reasoning_effort: settings.reasoningEffort }),
    },
    { signal },
  );
  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new AiError("bad_output");
  return parsed;
}

/** Server-side log of the provider's error (status + a short message). Never the key or prompt. */
function logProviderError(err: unknown): void {
  if (err instanceof AiError) return;
  const status = err instanceof APIError ? err.status : undefined;
  const message = err instanceof Error ? err.message.replace(/\s+/g, " ").slice(0, 300) : "unknown";
  console.warn(JSON.stringify({ ai_error: status ?? null, message }));
}

function classify(err: unknown, signal: AbortSignal): AiError {
  logProviderError(err);
  if (err instanceof AiError) return err;
  if (signal.aborted) return new AiError("timeout");
  if (err instanceof APIError && typeof err.status === "number") {
    if (err.status === 429) return new AiError("rate_limited");
    if (err.status === 401 || err.status === 403) return new AiError("auth");
    if (err.status >= 500) return new AiError("server_error");
    if (err.status >= 400) return new AiError("bad_request");
  }
  if (err instanceof Error && /timed? ?out/i.test(err.message)) return new AiError("timeout");
  // Zod parse failures, truncated output (LengthFinishReasonError), refusals.
  if (err instanceof Error && /zod|length|refus|parse|json/i.test(`${err.name} ${err.message}`))
    return new AiError("bad_output");
  return new AiError("error");
}

/** Busy (5xx) or out of quota (429): worth one more try, on the fallback model if there is one. */
const RETRYABLE: ReadonlySet<AiFailure> = new Set(["server_error", "rate_limited"]);

/**
 * Ask the model for an outfit. One call, plus one retry when the model is busy or out of
 * quota (on AI_FALLBACK_MODEL if set; a 429 is only retried when there is a different model).
 * Never longer than AI_TIMEOUT_MS overall. Throws AiError on any failure (the caller falls back).
 */
export async function askModel(summary: DaySummary, profile: Profile): Promise<AiOutfit> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    try {
      return await callOnce(summary, profile, controller.signal);
    } catch (err) {
      const failure = classify(err, controller.signal);
      const hasOtherModel = getAiSettings().fallbackModel !== null;
      if (!RETRYABLE.has(failure.kind)) throw failure;
      if (failure.kind === "rate_limited" && !hasOtherModel) throw failure;
      return await callOnce(summary, profile, controller.signal, true);
    }
  } catch (err) {
    throw classify(err, controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
