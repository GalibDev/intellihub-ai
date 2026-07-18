import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

const client = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

export async function generateText(prompt: string, systemInstruction?: string) {
  if (!client) throw new ApiError(503, "Gemini is not configured. Add GEMINI_API_KEY to the server environment.");
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { systemInstruction, temperature: 0.65, maxOutputTokens: 4096 },
  });
  const text = response.text?.trim();
  if (!text) throw new ApiError(502, "The AI provider returned an empty response");
  return text;
}

export function parseAiJson<T>(value: string): T {
  const normalized = value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(normalized) as T; } catch { throw new ApiError(502, "The AI response could not be parsed"); }
}
