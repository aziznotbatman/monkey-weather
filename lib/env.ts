import "server-only";

/**
 * AI provider settings. Any provider with an OpenAI-compatible Chat Completions endpoint and
 * JSON-schema structured output works (Google Gemini, OpenAI, Groq, OpenRouter, ...).
 * Default: Google Gemini's free tier.
 */
export const DEFAULT_AI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
export const DEFAULT_AI_MODEL = "gemini-3.5-flash-lite";
/** Tried once when the main model is busy (503) or out of quota (429). */
export const DEFAULT_AI_FALLBACK_MODEL = "gemini-3.1-flash-lite";
export const DEFAULT_REASONING_EFFORT = "minimal";

const REASONING_EFFORTS = ["none", "minimal", "low", "medium", "high"] as const;
export type ReasoningSetting = (typeof REASONING_EFFORTS)[number] | "off";

export interface AiSettings {
  apiKey: string;
  baseURL: string;
  model: string;
  /** Second model for one retry when the first is overloaded; null = retry the same model. */
  fallbackModel: string | null;
  /** "off" means: don't send the parameter at all (for models that reject it). */
  reasoningEffort: ReasoningSetting;
}

function apiKey(): string {
  return process.env.AI_API_KEY?.trim() ?? "";
}

export function isAiConfigured(): boolean {
  return apiKey().length > 20;
}

function baseURL(): string {
  const raw = process.env.AI_BASE_URL?.trim();
  if (!raw) return DEFAULT_AI_BASE_URL;
  try {
    return new URL(raw).protocol === "https:" ? raw : DEFAULT_AI_BASE_URL;
  } catch {
    return DEFAULT_AI_BASE_URL;
  }
}

const MODEL_ID = /^[a-zA-Z0-9._:/-]{2,80}$/;

function model(): string {
  const raw = process.env.AI_MODEL?.trim();
  return raw && MODEL_ID.test(raw) ? raw : DEFAULT_AI_MODEL;
}

function fallbackModel(): string | null {
  const raw = process.env.AI_FALLBACK_MODEL?.trim();
  if (raw?.toLowerCase() === "off") return null;
  if (raw && MODEL_ID.test(raw)) return raw;
  // The default fallback is a Gemini model, so only use it with the default provider.
  return process.env.AI_BASE_URL?.trim() ? null : DEFAULT_AI_FALLBACK_MODEL;
}

function reasoningEffort(): ReasoningSetting {
  const raw = process.env.AI_REASONING_EFFORT?.trim().toLowerCase();
  if (raw === "off") return "off";
  return (REASONING_EFFORTS as readonly string[]).includes(raw ?? "")
    ? (raw as ReasoningSetting)
    : DEFAULT_REASONING_EFFORT;
}

export function getAiSettings(): AiSettings {
  return {
    apiKey: apiKey(),
    baseURL: baseURL(),
    model: model(),
    fallbackModel: fallbackModel(),
    reasoningEffort: reasoningEffort(),
  };
}
