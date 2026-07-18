import type { Request, Response } from "express";
import { Activity, Generation, User } from "../models/index.js";
import { generateImage as requestImage } from "../services/image.service.js";
import { ApiError, ok } from "../utils/http.js";

const FREE_IMAGE_LIMIT = 2;

function hasActiveProPlan(user: {
  plan?: string | null;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodEnd?: Date | null;
}) {
  return (
    user.plan === "pro" &&
    ["active", "trialing"].includes(user.subscriptionStatus || "") &&
    (!user.subscriptionCurrentPeriodEnd ||
      user.subscriptionCurrentPeriodEnd.getTime() > Date.now())
  );
}

export async function status(req: Request, res: Response) {
  const used = req.user!.imageGenerationCount || 0;
  const isPro = hasActiveProPlan(req.user!);
  return ok(
    res,
    {
      plan: isPro ? "pro" : "free",
      used,
      limit: isPro ? null : FREE_IMAGE_LIMIT,
      remaining: isPro ? null : Math.max(0, FREE_IMAGE_LIMIT - used),
      price: 10,
      subscriptionStatus: req.user!.subscriptionStatus || "inactive",
    },
    "Image allowance loaded",
  );
}

export async function generate(req: Request, res: Response) {
  const isPro = hasActiveProPlan(req.user!);
  let reserved = false;

  if (!isPro) {
    const user = await User.findOneAndUpdate(
      {
        _id: req.user!._id,
        $or: [
          { imageGenerationCount: { $lt: FREE_IMAGE_LIMIT } },
          { imageGenerationCount: { $exists: false } },
        ],
      },
      { $inc: { imageGenerationCount: 1 } },
      { new: true },
    );
    if (!user) {
      throw new ApiError(
        402,
        "Your 2 free images are used. Upgrade to Pro for $10/month to continue.",
      );
    }
    reserved = true;
  } else {
    await User.findByIdAndUpdate(req.user!._id, {
      $inc: { imageGenerationCount: 1 },
    });
  }

  try {
    const { prompt, style, size } = req.body as {
      prompt: string;
      style: string;
      size: "1024x1024" | "1536x1024" | "1024x1536";
    };
    const styledPrompt = `${prompt.trim()}\nVisual style: ${style}. Create one polished, safe, high-quality image. Do not include text unless explicitly requested.`;
    const result = await requestImage(styledPrompt, size);
    const used = (req.user!.imageGenerationCount || 0) + 1;

    await Promise.all([
      Generation.create({
        user: req.user!._id,
        type: "image",
        input: { prompt, style, size },
        output: result.image.startsWith("data:")
          ? "Generated image"
          : result.image,
        title: prompt.slice(0, 80),
      }),
      Activity.create({
        user: req.user!._id,
        action: "image.generate",
        detail: `Generated an image: ${prompt.slice(0, 70)}`,
      }),
    ]);

    return ok(
      res,
      {
        ...result,
        usage: {
          plan: isPro ? "pro" : "free",
          used,
          limit: isPro ? null : FREE_IMAGE_LIMIT,
          remaining: isPro ? null : Math.max(0, FREE_IMAGE_LIMIT - used),
        },
      },
      "Image generated",
      201,
    );
  } catch (error) {
    if (reserved || isPro) {
      await User.findByIdAndUpdate(req.user!._id, {
        $inc: { imageGenerationCount: -1 },
      }).catch(() => undefined);
    }
    throw error;
  }
}
