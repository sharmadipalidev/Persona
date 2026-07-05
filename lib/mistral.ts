import OpenAI from "openai";

export const MISTRAL_MODEL = "mistral-small-latest";

export function createMistralClient() {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.mistral.ai/v1",
  });
}
