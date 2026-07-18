"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Crown,
  Download,
  ImageIcon,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Protected } from "@/components/site-shell";
import {
  Button,
  Card,
  Field,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { api } from "@/services/api";

type ImageUsage = {
  plan: "free" | "pro";
  used: number;
  limit: number | null;
  remaining: number | null;
  price?: number;
  subscriptionStatus?: string;
};

type ImageResult = {
  image: string;
  revisedPrompt?: string;
  usage: ImageUsage;
};

export default function ImageGeneratorPage() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Photorealistic");
  const [size, setSize] = useState("1024x1024");
  const [result, setResult] = useState<ImageResult>();
  const [generating, setGenerating] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const usage = useQuery({
    queryKey: ["image-usage"],
    queryFn: () => api.get<ImageUsage>("/images/status"),
  });

  useEffect(() => {
    const upgrade = new URLSearchParams(window.location.search).get("upgrade");
    if (upgrade === "success") {
      toast.success("Payment received. Your Pro plan is being activated.");
      void usage.refetch();
      window.history.replaceState({}, "", "/ai/image-generator");
    }
  }, []);

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    try {
      const next = await api.post<ImageResult>("/images/generate", {
        prompt,
        style,
        size,
      });
      setResult(next);
      queryClient.setQueryData(["image-usage"], next.usage);
      toast.success("Image generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
      void usage.refetch();
    } finally {
      setGenerating(false);
    }
  };

  const upgrade = async () => {
    setUpgrading(true);
    try {
      const checkout = await api.post<{ url: string }>("/billing/checkout");
      window.location.assign(checkout.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setUpgrading(false);
    }
  };

  const exhausted = usage.data?.plan === "free" && usage.data.remaining === 0;

  return (
    <Protected>
      <section className="border-b bg-gradient-to-b from-lavender/70 to-white">
        <div className="container py-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand shadow-sm">
            <Sparkles className="size-3.5" /> AI image studio
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
            Create images from your ideas
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Describe a scene, choose a style, and generate a high-quality image.
          </p>
        </div>
      </section>

      <div className="container grid items-start gap-6 py-10 lg:grid-cols-[370px_1fr]">
        <div className="space-y-5">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold">Image brief</h2>
              {usage.isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <span className="rounded-full bg-lavender px-3 py-1 text-xs font-bold text-brand">
                  {usage.data?.plan === "pro"
                    ? "Pro · Unlimited"
                    : `${usage.data?.remaining ?? 0} free left`}
                </span>
              )}
            </div>
            <form onSubmit={generate} className="space-y-4">
              <Field label="Describe your image">
                <Textarea
                  required
                  minLength={3}
                  maxLength={2000}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="A futuristic workspace overlooking Dhaka at sunset, cinematic lighting..."
                  className="min-h-36"
                />
              </Field>
              <Field label="Visual style">
                <Select
                  value={style}
                  onChange={(event) => setStyle(event.target.value)}
                >
                  {[
                    "Photorealistic",
                    "Digital art",
                    "3D render",
                    "Illustration",
                    "Cinematic",
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Image size">
                <Select
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                >
                  <option value="1024x1024">Square · 1024 × 1024</option>
                  <option value="1536x1024">Landscape · 1536 × 1024</option>
                  <option value="1024x1536">Portrait · 1024 × 1536</option>
                </Select>
              </Field>
              <Button
                type="submit"
                loading={generating}
                disabled={exhausted || !prompt.trim()}
                className="w-full"
              >
                <WandSparkles className="size-4" />
                {exhausted ? "Free limit reached" : "Generate image"}
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden border-brand/25">
            <div className="gradient-panel p-5 text-white">
              <div className="flex items-center gap-2">
                <Crown className="size-5" />
                <strong>Image Pro</strong>
              </div>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-black">$10</span>
                <span className="pb-1 text-sm text-white/70">/month</span>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-2 text-sm text-slate-600">
                {[
                  "Unlimited generations",
                  "All image sizes",
                  "Commercial-ready downloads",
                ].map((item) => (
                  <p key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500" /> {item}
                  </p>
                ))}
              </div>
              <Button
                type="button"
                onClick={upgrade}
                loading={upgrading}
                disabled={usage.data?.plan === "pro"}
                className="mt-5 w-full"
              >
                {usage.data?.plan === "pro"
                  ? "Your plan is active"
                  : "Upgrade to Pro"}
              </Button>
            </div>
          </Card>
        </div>

        <Card className="grid min-h-[650px] place-items-center overflow-hidden bg-slate-50 p-5 md:p-8">
          {generating ? (
            <div className="w-full max-w-xl space-y-5 text-center">
              <div className="aspect-square animate-pulse rounded-3xl bg-gradient-to-br from-lavender to-slate-200" />
              <p className="text-sm font-semibold text-brand">
                Creating your image…
              </p>
            </div>
          ) : result ? (
            <div className="w-full max-w-3xl">
              <img
                src={result.image}
                alt={prompt || "Generated AI artwork"}
                className="mx-auto max-h-[620px] w-auto max-w-full rounded-3xl object-contain shadow-2xl"
              />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-sm text-slate-500">
                  {result.revisedPrompt || prompt}
                </p>
                <a href={result.image} download="intellihub-image.png">
                  <span className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-brand/20 bg-white px-5 text-sm font-semibold text-brand transition hover:bg-lavender">
                    <Download className="size-4" /> Download
                  </span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-lavender text-brand">
                <ImageIcon className="size-10" />
              </span>
              <h2 className="mt-5 text-xl font-black">
                Your image will appear here
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Every account includes two free image generations.
              </p>
            </div>
          )}
        </Card>
      </div>
    </Protected>
  );
}
