import "server-only";
import OpenAI, { APIError } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAiModel } from "./env";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { AiOutfitSchema, type AiOutfit, type DaySummary, type Profile } from "./schema";

export const AI_TIMEOUT_MS = 12_000;
export const AI_MAX_OUTPUT_TOKENS = 600;

export type AiFailure =
  "no_key" | "timeout" | "rate_limited" | "server_error" | "bad_output" | "error";

export class AiError extends Error {
  constructor(public readonly kind: AiFailure) {
    super(kind);
  }
}

let client: OpenAI | null = null;
function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiError("no_key");
  // One retry, only on 5xx/connection errors (handled by the SDK), and a hard timeout.
  client ??= new OpenAI({ apiKey, timeout: AI_TIMEOUT_MS, maxRetries: 0 });
  return client;
}

async function callOnce(
  summary: DaySummary,
  profile: Profile,
  signal: AbortSignal,
): Promise<AiOutfit> {
  const response = await getClient().responses.parse(
    {
      model: getOpenAiModel(),
      instructions: SYSTEM_PROMPT,
      input: buildUserMessage(summary, profile),
      max_output_tokens: AI_MAX_OUTPUT_TOKENS,
      reasoning: { effort: "none" },
      text: { format: zodTextFormat(AiOutfitSchema, "monkey_outfit") },
      store: false,
    },
    { signal },
  );
  if (!response.output_parsed) throw new AiError("bad_output");
  return response.output_parsed;
}

function classify(err: unknown, signal: AbortSignal): AiError {
  if (err instanceof AiError) return err;
  if (signal.aborted) return new AiError("timeout");
  if (err instanceof APIError) {
    if (err.status === 429) return new AiError("rate_limited");
    if (typeof err.status === "number" && err.status >= 500) return new AiError("server_error");
  }
  if (err instanceof Error && /timed? ?out/i.test(err.message)) return new AiError("timeout");
  if (err instanceof Error && err.name === "ZodError") return new AiError("bad_output");
  return new AiError("error");
}

/**
 * Ask the model for an outfit. One call; one quick retry only on a 5xx; never longer than
 * AI_TIMEOUT_MS overall. Throws AiError on any failure (the caller falls back).
 */
export async function askModel(summary: DaySummary, profile: Profile): Promise<AiOutfit> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    try {
      return await callOnce(summary, profile, controller.signal);
    } catch (err) {
      const kind = classify(err, controller.signal);
      if (kind.kind !== "server_error") throw kind;
      return await callOnce(summary, profile, controller.signal);
    }
  } catch (err) {
    throw classify(err, controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
