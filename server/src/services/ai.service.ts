import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

const client = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

type WalkAiResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string } | string;
};

async function generateWithWalkAi(prompt: string, systemInstruction?: string) {
  if (!env.WALKAI_API_KEY) throw new ApiError(503, "WalkAI is not configured. Add WALKAI_API_KEY to the server environment.");
  const baseUrl = env.WALKAI_BASE_URL.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.WALKAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.WALKAI_MODEL,
      messages: [
        ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
        { role: "user", content: prompt },
      ],
      temperature: 0.65,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await response.json().catch(() => ({})) as WalkAiResponse;
  if (!response.ok) {
    const providerMessage = typeof payload.error === "string" ? payload.error : payload.error?.message;
    throw new ApiError(response.status >= 500 ? 502 : response.status, providerMessage || `WalkAI request failed with status ${response.status}`);
  }
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new ApiError(502, "WalkAI returned an empty response");
  return text;
}

export async function generateText(prompt: string, systemInstruction?: string) {
  if (env.AI_PROVIDER === "walkai") return generateWithWalkAi(prompt, systemInstruction);
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
