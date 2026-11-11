import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_FALLBACK_MODEL,
  DEFAULT_AI_MODEL,
  DEFAULT_REASONING_EFFORT,
  getAiSettings,
  isAiConfigured,
} from "@/lib/env";

const KEYS = [
  "AI_API_KEY",
  "AI_BASE_URL",
  "AI_MODEL",
  "AI_FALLBACK_MODEL",
  "AI_REASONING_EFFORT",
] as const;

afterEach(() => {
  for (const k of KEYS) vi.stubEnv(k, "");
  vi.unstubAllEnvs();
});

describe("AI settings", () => {
  it("is not configured without a key, or with a too-short one", () => {
    vi.stubEnv("AI_API_KEY", "");
    expect(isAiConfigured()).toBe(false);
    vi.stubEnv("AI_API_KEY", "  short  ");
    expect(isAiConfigured()).toBe(false);
  });

  it("is configured with a realistic key and trims whitespace", () => {
    vi.stubEnv("AI_API_KEY", "  AIzaTESTTESTTESTTESTTESTTEST  ");
    expect(isAiConfigured()).toBe(true);
    expect(getAiSettings().apiKey).toBe("AIzaTESTTESTTESTTESTTESTTEST");
  });

  it("defaults to Gemini's OpenAI-compatible endpoint and Flash-Lite", () => {
    const s = getAiSettings();
    expect(s.baseURL).toBe(DEFAULT_AI_BASE_URL);
    expect(s.model).toBe(DEFAULT_AI_MODEL);
    expect(s.reasoningEffort).toBe(DEFAULT_REASONING_EFFORT);
  });

  it("accepts another https provider and model id", () => {
    vi.stubEnv("AI_BASE_URL", "https://api.groq.com/openai/v1");
    vi.stubEnv("AI_MODEL", "openai/gpt-oss-120b");
    const s = getAiSettings();
    expect(s.baseURL).toBe("https://api.groq.com/openai/v1");
    expect(s.model).toBe("openai/gpt-oss-120b");
  });

  it("rejects non-https or malformed base URLs and odd model ids", () => {
    vi.stubEnv("AI_BASE_URL", "http://example.com/v1");
    expect(getAiSettings().baseURL).toBe(DEFAULT_AI_BASE_URL);
    vi.stubEnv("AI_BASE_URL", "not a url");
    expect(getAiSettings().baseURL).toBe(DEFAULT_AI_BASE_URL);
    vi.stubEnv("AI_MODEL", "model with spaces");
    expect(getAiSettings().model).toBe(DEFAULT_AI_MODEL);
  });

  it("reads reasoning effort, including 'off', and ignores unknown values", () => {
    vi.stubEnv("AI_REASONING_EFFORT", "OFF");
    expect(getAiSettings().reasoningEffort).toBe("off");
    vi.stubEnv("AI_REASONING_EFFORT", "minimal");
    expect(getAiSettings().reasoningEffort).toBe("minimal");
    vi.stubEnv("AI_REASONING_EFFORT", "turbo");
    expect(getAiSettings().reasoningEffort).toBe(DEFAULT_REASONING_EFFORT);
  });

  it("uses a second Gemini model for busy retries, only with the default provider", () => {
    expect(getAiSettings().fallbackModel).toBe(DEFAULT_AI_FALLBACK_MODEL);
    vi.stubEnv("AI_FALLBACK_MODEL", "off");
    expect(getAiSettings().fallbackModel).toBeNull();
    vi.stubEnv("AI_FALLBACK_MODEL", "");
    vi.stubEnv("AI_BASE_URL", "https://api.openai.com/v1");
    expect(getAiSettings().fallbackModel).toBeNull();
    vi.stubEnv("AI_FALLBACK_MODEL", "gpt-6-luna");
    expect(getAiSettings().fallbackModel).toBe("gpt-6-luna");
  });
});
