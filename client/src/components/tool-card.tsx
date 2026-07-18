"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Badge, Button, Card } from "./ui";
import { money } from "@/lib/utils";
import type { Tool } from "@/types";

export function ToolCard({ tool }: { tool: Tool }) {
  const favorite = async () => {
    try {
      await api.post(`/favorites/${tool._id}`);
      toast.success("Saved to favorites");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Sign in to save tools",
      );
    }
  };
  const href =
    tool.slug === "ai-image-generator"
      ? "/ai/image-generator"
      : `/tools/${tool.slug}`;
  const isImageGenerator = tool.slug === "ai-image-generator";
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-lavender">
        <Image
          src={tool.imageUrl}
          alt={tool.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <button
          onClick={favorite}
          aria-label={`Save ${tool.title}`}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-slate-500 shadow hover:text-brand"
        >
          <Heart className="size-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge>{tool.category}</Badge>
          <span className="flex items-center gap-1 text-xs font-semibold">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {tool.rating.toFixed(1)} ({tool.reviewCount})
          </span>
        </div>
        <h3 className="text-lg font-bold text-navy">{tool.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
          {tool.shortDescription}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <span className="block text-xs text-slate-400">
              {tool.toolType}
            </span>
            <strong className="text-sm text-navy">
              {isImageGenerator ? "2 free · then $10/mo" : money(tool.price)}
            </strong>
          </div>
          {isImageGenerator ? (
            <div className="flex gap-2">
              <Link href={href}>
                <Button variant="secondary" className="h-9 px-3">
                  Try free
                </Button>
              </Link>
              <Link href="/ai/image-generator#pricing">
                <Button className="h-9 px-3">Purchase</Button>
              </Link>
            </div>
          ) : (
            <Link href={href}>
              <Button className="h-9 px-3.5">View details</Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
