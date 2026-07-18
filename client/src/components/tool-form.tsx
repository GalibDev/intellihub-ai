"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/services/api";
import type { Tool } from "@/types";
import { Button, Card, Field, Input, Select, Skeleton, Textarea } from "./ui";
const schema = z.object({
  title: z.string().min(3),
  shortDescription: z.string().min(20).max(220),
  fullDescription: z.string().min(50),
  category: z.string().min(1),
  toolType: z.string().min(1),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price"),
  priority: z.string().min(1),
  imageUrl: z.union([z.literal(""), z.url()]),
  galleryImages: z.string(),
  features: z.string().min(2),
  tags: z.string().min(1),
  isPublished: z.boolean(),
});
type Values = z.infer<typeof schema>;
const defaults: Values = {
  title: "",
  shortDescription: "",
  fullDescription: "",
  category: "Content",
  toolType: "Generator",
  price: "0",
  priority: "Medium",
  imageUrl: "",
  galleryImages: "",
  features: "",
  tags: "",
  isPublished: true,
};
export function ToolForm({ id }: { id?: string }) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["owned-tool", id],
    enabled: !!id,
    queryFn: () => api.get<Tool>(`/tools/id/${id}`),
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  useEffect(() => {
    if (query.data)
      reset({
        ...query.data,
        price: String(query.data.price),
        galleryImages: query.data.galleryImages.join("\n"),
        features: query.data.features.join(", "),
        tags: query.data.tags.join(", "),
      });
  }, [query.data, reset]);
  const submit = async (values: Values) => {
    const split = (value: string, separator: RegExp) =>
      value
        .split(separator)
        .map((item) => item.trim())
        .filter(Boolean);
    const payload = {
      ...values,
      imageUrl:
        values.imageUrl ||
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=85",
      price: Number(values.price),
      galleryImages: split(values.galleryImages, /\n/),
      features: split(values.features, /,|\n/),
      tags: split(values.tags, /,|\n/),
    };
    try {
      if (id) await api.patch(`/tools/${id}`, payload);
      else await api.post("/tools", payload);
      toast.success(id ? "Tool updated" : "Tool created");
      router.push("/items/manage");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save tool",
      );
    }
  };
  const imageUrl = watch("imageUrl");
  if (id && query.isLoading) return <Skeleton className="h-[640px]" />;
  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="grid items-start gap-6 lg:grid-cols-[1fr_320px]"
    >
      <Card className="grid gap-5 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Title" error={errors.title?.message}>
            <Input
              placeholder="e.g. AI Meeting Summarizer"
              {...register("title")}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field
            label="Short description"
            error={errors.shortDescription?.message}
          >
            <Textarea
              className="min-h-24"
              placeholder="A clear one-sentence summary for listing cards"
              {...register("shortDescription")}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field
            label="Full description"
            error={errors.fullDescription?.message}
          >
            <Textarea
              className="min-h-40"
              placeholder="Explain what it does, who it helps, and the outcome"
              {...register("fullDescription")}
            />
          </Field>
        </div>
        <Field label="Category" error={errors.category?.message}>
          <Select {...register("category")}>
            {[
              "Content",
              "Chat",
              "Data",
              "Documents",
              "Images",
              "Productivity",
              "Recommendations",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tool type" error={errors.toolType?.message}>
          <Select {...register("toolType")}>
            {[
              "Generator",
              "Assistant",
              "Analyzer",
              "Classifier",
              "Recommendation Engine",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </Field>
        <Field label="Monthly price (USD)" error={errors.price?.message}>
          <Input inputMode="decimal" {...register("price")} />
        </Field>
        <Field label="Priority" error={errors.priority?.message}>
          <Select {...register("priority")}>
            {["Low", "Medium", "High"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Field
            label="Main image URL (optional)"
            error={errors.imageUrl?.message}
          >
            <Input placeholder="https://…" {...register("imageUrl")} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field
            label="Gallery image URLs"
            error={errors.galleryImages?.message}
          >
            <Textarea
              className="min-h-24"
              placeholder="One URL per line"
              {...register("galleryImages")}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Features" error={errors.features?.message}>
            <Textarea
              className="min-h-24"
              placeholder="Context awareness, Secure exports, Team sharing"
              {...register("features")}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Tags" error={errors.tags?.message}>
            <Input
              placeholder="productivity, meetings, audio"
              {...register("tags")}
            />
          </Field>
        </div>
        <label className="md:col-span-2 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="size-4 accent-brand"
            {...register("isPublished")}
          />
          Publish immediately
        </label>
      </Card>
      <div className="sticky top-24">
        <Card className="overflow-hidden">
          <div className="relative aspect-square bg-lavender">
            {imageUrl?.startsWith("http") ? (
              <Image
                src={imageUrl}
                alt="Tool preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                Image preview
              </div>
            )}
          </div>
          <div className="p-5">
            <span className="text-xs font-bold text-brand">LIVE PREVIEW</span>
            <h3 className="mt-2 text-lg font-bold">
              {watch("title") || "Tool title"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {watch("shortDescription") ||
                "Your short description will appear here."}
            </p>
            <Button
              loading={isSubmitting}
              type="submit"
              className="mt-5 w-full"
            >
              {id ? "Save changes" : "Create tool"}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              variant="ghost"
              className="mt-2 w-full"
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}
