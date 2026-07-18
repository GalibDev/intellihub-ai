import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

type WalkAiImageResponse = {
  data?: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>;
  error?: { message?: string } | string;
};
type WalkAiModelList = { data?: Array<{ id?: string }> };
let imageModels: string[] | undefined;

async function resolveImageModels(baseUrl: string) {
  if (imageModels) return imageModels;
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${env.WALKAI_IMAGE_API_KEY}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return [env.WALKAI_IMAGE_MODEL];
    const payload = (await response.json()) as WalkAiModelList;
    const available =
      payload.data
        ?.map((item) => item.id?.trim())
        .filter((id): id is string => Boolean(id)) || [];
    const likelyImageModels = available.filter((id) =>
      /image|imagen|dall.?e/i.test(id),
    );
    imageModels = [
      ...(available.includes(env.WALKAI_IMAGE_MODEL)
        ? [env.WALKAI_IMAGE_MODEL]
        : []),
      ...likelyImageModels,
      env.WALKAI_IMAGE_MODEL,
    ].filter((id, index, all) => all.indexOf(id) === index);
    return imageModels;
  } catch {
    return [env.WALKAI_IMAGE_MODEL];
  }
}

export async function generateImage(
  prompt: string,
  size: "1024x1024" | "1536x1024" | "1024x1536",
) {
  if (!env.WALKAI_IMAGE_API_KEY) {
    throw new ApiError(
      503,
      "Image generation is not configured. Add WALKAI_IMAGE_API_KEY to Render.",
    );
  }

  const baseUrl = env.WALKAI_BASE_URL.replace(/\/$/, "");
  const models = (await resolveImageModels(baseUrl)).slice(0, 6);
  let lastFailure = "WalkAI has no available image model";

  for (const model of models) {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WALKAI_IMAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, prompt, n: 1, size }),
      signal: AbortSignal.timeout(150_000),
    });
    const payload = (await response
      .json()
      .catch(() => ({}))) as WalkAiImageResponse;
    const providerMessage =
      typeof payload.error === "string"
        ? payload.error
        : payload.error?.message;

    if (response.ok) {
      const result = payload.data?.[0];
      const image =
        result?.url ||
        (result?.b64_json
          ? `data:image/png;base64,${result.b64_json}`
          : undefined);
      if (image) return { image, revisedPrompt: result?.revised_prompt };
      lastFailure = `WalkAI model ${model} returned no image`;
      continue;
    }

    lastFailure =
      providerMessage || `Image provider failed with status ${response.status}`;
    if (!/model|unsupported|available|channel/i.test(lastFailure)) {
      throw new ApiError(
        response.status >= 500 ? 502 : response.status,
        lastFailure,
      );
    }
  }

  throw new ApiError(502, lastFailure);
}
