"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  FileSearch,
  LineChart,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { Pagination, Tool } from "@/types";
import { Button, Card, EmptyState, ErrorState, Input, Skeleton } from "./ui";
import { ToolCard } from "./tool-card";

export function Hero() {
  return (
    <section className="relative overflow-hidden dot-grid">
      <div className="container grid min-h-[66vh] items-center gap-8 py-14 lg:grid-cols-[1.02fr_.98fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-lavender px-3 py-1.5 text-xs font-bold text-brand">
            <Sparkles className="size-3.5" />
            Agentic AI workspace
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.06] tracking-[-.045em] text-navy sm:text-5xl lg:text-7xl">
            AI That Understands.
            <br />
            <span className="text-brand">Solutions That Deliver.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
            IntelliHub AI combines intelligent assistants, content generation,
            document analysis, data insights, and personalized recommendations
            in one secure workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register">
              <Button className="h-12 px-6">
                Get started free <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="secondary" className="h-12 px-6">
                Explore AI tools
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-xs font-medium text-slate-500">
            <span className="flex gap-2">
              <Check className="size-4 text-emerald-500" />
              No credit card
            </span>
            <span className="flex gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              Privacy-first
            </span>
            <span className="flex gap-2">
              <Zap className="size-4 text-emerald-500" />
              Ready in minutes
            </span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative mx-auto w-full max-w-[610px]"
        >
          <div className="absolute inset-10 rounded-full bg-brand/20 blur-3xl" />
          <Image
            src="/images/intellihub-hero.png"
            width={1254}
            height={1254}
            priority
            alt="IntelliHub AI assistant robot with analytics, chat, document and automation panels"
            className="relative w-full rounded-[2.5rem] mix-blend-multiply"
          />
        </motion.div>
      </div>
    </section>
  );
}

export function FeaturedTools() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["featured-tools"],
    queryFn: () =>
      api.get<{ items: Tool[]; pagination: Pagination }>(
        "/tools?sort=rating&limit=6",
      ),
  });
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {error ? (
        <ErrorState message={error.message} retry={refetch} />
      ) : isLoading ? (
        Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[410px]" />
        ))
      ) : data?.items.length ? (
        data.items.map((tool) => <ToolCard key={tool._id} tool={tool} />)
      ) : (
        <EmptyState title="No featured tools yet" description="Run the seed script or publish a tool to feature it here." />
      )}
    </div>
  );
}

const capabilities = [
  [
    BrainCircuit,
    "Plans with context",
    "Combines your request, workspace history, and available tools before responding.",
  ],
  [
    Zap,
    "Calls secure tools",
    "Retrieves approved MongoDB data through server-side functions—not browser queries.",
  ],
  [
    ShieldCheck,
    "Respects boundaries",
    "Limits conversation context, validates inputs, and applies ownership permissions.",
  ],
];
export function Capabilities() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {capabilities.map(([Icon, title, copy]) => (
        <Card key={title as string} className="p-6">
          <span className="grid size-12 place-items-center rounded-2xl bg-lavender text-brand">
            <Icon />
          </span>
          <h3 className="mt-5 text-lg font-bold">{title as string}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {copy as string}
          </p>
        </Card>
      ))}
    </div>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", {
        name: "Newsletter subscriber",
        email,
        subject: "Newsletter signup",
        message:
          "Please add me to IntelliHub AI product updates and practical AI workflow tips.",
      });
      toast.success("You're on the list!");
      setEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not subscribe",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-7 flex max-w-lg flex-col gap-2 sm:flex-row"
    >
      <div className="relative flex-1">
        <Mail className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
        <Input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your work email"
          className="pl-10"
        />
      </div>
      <Button loading={loading}>Get updates</Button>
    </form>
  );
}

export const toolHighlights = [
  [
    MessageSquareText,
    "AI Chat Assistant",
    "Grounded answers and route guidance",
  ],
  [WandSparkles, "Content Generator", "On-brand content for five formats"],
  [
    FileSearch,
    "Document Intelligence",
    "Summaries, actions, and extracted facts",
  ],
  [LineChart, "Data Analyzer", "Patterns and decision-ready insights"],
  [Bot, "Image Understanding", "Explain visual content clearly"],
  [BrainCircuit, "Smart Recommendations", "Tools ranked for your real goals"],
] as const;
