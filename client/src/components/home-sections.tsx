"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  LineChart,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { Pagination, Tool } from "@/types";
import { Button, Card, EmptyState, ErrorState, Input, Skeleton } from "./ui";
import { ToolCard } from "./tool-card";

const heroSlides = [
  {
    eyebrow: "Agentic AI workspace",
    title: "AI That Understands.",
    accent: "Solutions That Deliver.",
    description:
      "Plan, create, analyze, and make decisions with one secure assistant that understands your workflow.",
    primary: "Get started free",
    primaryHref: "/register",
    secondary: "Explore AI tools",
    secondaryHref: "/explore",
    visualTitle: "Your intelligent workspace",
    visualCopy: "One assistant, every useful workflow",
    badges: [
      [MessageSquareText, "Context-aware chat"],
      [BrainCircuit, "Agentic planning"],
      [Zap, "Fast execution"],
    ],
    glow: "from-violet-500/25 via-indigo-400/15 to-transparent",
  },
  {
    eyebrow: "Create and understand",
    title: "Turn Ideas Into Content.",
    accent: "Documents Into Decisions.",
    description:
      "Generate polished content, summarize long files, and surface the facts and actions that matter most.",
    primary: "Start creating",
    primaryHref: "/ai/content-generator",
    secondary: "Analyze documents",
    secondaryHref: "/ai/document-intelligence",
    visualTitle: "From input to insight",
    visualCopy: "Useful output without the busywork",
    badges: [
      [WandSparkles, "Content generation"],
      [FileSearch, "Document insights"],
      [Check, "Action summaries"],
    ],
    glow: "from-fuchsia-500/25 via-violet-400/15 to-transparent",
  },
  {
    eyebrow: "Smarter recommendations",
    title: "Find The Right AI Tool.",
    accent: "Move Forward With Clarity.",
    description:
      "Match your goal, experience, and budget with focused recommendations grounded in real workspace data.",
    primary: "Get recommendations",
    primaryHref: "/recommendations",
    secondary: "Ask the assistant",
    secondaryHref: "/chat",
    visualTitle: "Recommendations that fit",
    visualCopy: "Ranked for your goal and budget",
    badges: [
      [BarChart3, "Goal-based ranking"],
      [ShieldCheck, "Private by design"],
      [Sparkles, "Personalized matches"],
    ],
    glow: "from-indigo-500/25 via-sky-400/15 to-transparent",
  },
] as const;

export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = heroSlides[active];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % heroSlides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [active, paused]);

  const show = (index: number) =>
    setActive((index + heroSlides.length) % heroSlides.length);

  return (
    <section
      className="dot-grid relative h-[12cm] min-h-[420px] max-h-[12cm] overflow-hidden"
      aria-roledescription="carousel"
      aria-label="IntelliHub AI highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <motion.div
        className={`hero-glow pointer-events-none absolute -inset-[15%] bg-gradient-to-br ${slide.glow}`}
        animate={{ scale: [1, 1.08, 1], x: [0, 18, 0], y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="container relative grid h-full items-center gap-7 py-7 md:grid-cols-[1.08fr_.92fr] lg:gap-12">
        <motion.div
          key={`copy-${active}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="pb-9 md:pb-0"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-lavender px-3 py-1.5 text-xs font-bold text-brand">
            <Sparkles className="size-3.5" />
            {slide.eyebrow}
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.04] tracking-[-.045em] text-navy sm:text-5xl lg:text-[3.35rem]">
            {slide.title}
            <br />
            <span className="text-brand">{slide.accent}</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            {slide.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={slide.primaryHref}>
              <Button className="h-11 px-5">
                {slide.primary} <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href={slide.secondaryHref}>
              <Button variant="secondary" className="h-11 px-5">
                {slide.secondary}
              </Button>
            </Link>
          </div>
          <div className="mt-5 hidden flex-wrap gap-5 text-xs font-medium text-slate-500 sm:flex">
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
          key={`visual-${active}`}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="relative mx-auto hidden w-full max-w-[430px] md:block"
        >
          <div className="absolute inset-12 rounded-full bg-brand/25 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/80 bg-white/60 p-3 shadow-2xl shadow-brand/15 backdrop-blur">
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 0.35, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/images/intellihub-hero.png"
                width={1254}
                height={1254}
                priority={active === 0}
                alt="IntelliHub AI assistant with connected workflow panels"
                className="h-[300px] w-full rounded-[1.5rem] object-cover mix-blend-multiply lg:h-[330px]"
              />
            </motion.div>
            <div className="absolute inset-x-7 bottom-6 rounded-2xl border border-white/90 bg-white/90 p-3 shadow-lg backdrop-blur">
              <strong className="block text-sm text-navy">
                {slide.visualTitle}
              </strong>
              <span className="text-xs text-slate-500">{slide.visualCopy}</span>
            </div>
          </div>
          <div className="absolute -right-4 top-5 grid gap-2 lg:-right-10">
            {slide.badges.map(([Icon, label], index) => (
              <motion.span
                key={label}
                className="flex items-center gap-2 rounded-xl border bg-white/95 px-3 py-2 text-xs font-bold text-navy shadow-lg"
                animate={{ x: [0, index % 2 ? -5 : 5, 0], y: [0, -3, 0] }}
                transition={{
                  duration: 3.6 + index * 0.45,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.2,
                }}
              >
                <Icon className="size-4 text-brand" />
                {label}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
      <div className="absolute inset-x-0 bottom-4">
        <div className="container flex items-center justify-between">
          <div className="flex gap-2" role="tablist" aria-label="Hero slides">
            {heroSlides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`Show slide ${index + 1}: ${item.title}`}
                onClick={() => show(index)}
                className={`h-2 rounded-full transition-all ${index === active ? "w-8 bg-brand" : "w-2 bg-brand/25 hover:bg-brand/50"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous hero slide"
              onClick={() => show(active - 1)}
              className="grid size-9 place-items-center rounded-full border bg-white/90 text-navy shadow-sm transition hover:border-brand hover:text-brand"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next hero slide"
              onClick={() => show(active + 1)}
              className="grid size-9 place-items-center rounded-full border bg-white/90 text-navy shadow-sm transition hover:border-brand hover:text-brand"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
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
        <EmptyState
          title="No featured tools yet"
          description="Run the seed script or publish a tool to feature it here."
        />
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
