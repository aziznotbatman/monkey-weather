import "server-only";

/**
 * AI provider settings. Any provider with an OpenAI-compatible Chat Completions endpoint and
 * JSON-schema structured output works (Google Gemini, OpenAI, Groq, OpenRouter, ...).
 * Default: Google Gemini's free tier.
 */
export const DEFAULT_AI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
export const DEFAULT_AI_MODEL = "gemini-3.5-flash-lite";
export const DEFAULT_REASONING_EFFORT = "low";

const REASONING_EFFORTS = ["none", "minimal", "low", "medium", "high"] as const;
export type ReasoningSetting = (typeof REASONING_EFFORTS)[number] | "off";

export interface AiSettings {
  apiKey: string;
  baseURL: string;
  model: string;
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

function model(): string {
  const raw = process.env.AI_MODEL?.trim();
  return raw && /^[a-zA-Z0-9._:/-]{2,80}$/.test(raw) ? raw : DEFAULT_AI_MODEL;
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
    reasoningEffort: reasoningEffort(),
  };
}
