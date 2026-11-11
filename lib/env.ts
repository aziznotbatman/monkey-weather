import "server-only";

export const DEFAULT_OPENAI_MODEL = "gpt-6-luna";

export function isAiConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return typeof key === "string" && key.trim().length > 20;
}

export function getOpenAiModel(): string {
  const model = process.env.OPENAI_MODEL?.trim();
  return model && /^[a-zA-Z0-9._:-]{2,64}$/.test(model) ? model : DEFAULT_OPENAI_MODEL;
}
