"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  LogOut,
  Menu,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/app-providers";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

const publicLinks = [
  ["Home", "/"],
  ["Explore", "/explore"],
  ["AI Tools", "/ai-tools"],
  ["About", "/about"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];
const privateLinks = [
  ["Home", "/"],
  ["Explore", "/explore"],
  ["AI Tools", "/ai-tools"],
  ["Dashboard", "/dashboard"],
  ["Add Tool", "/items/add"],
  ["Manage Tools", "/items/manage"],
  ["Chat", "/chat"],
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 text-lg font-black tracking-tight",
        light ? "text-white" : "text-navy",
      )}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-brand text-white shadow-brand">
        <Sparkles className="size-5" />
      </span>
      IntelliHub AI
    </Link>
  );
}
export function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const links = user ? privateLinks : publicLinks;
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <nav className="container flex h-18 items-center justify-between">
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition hover:text-brand",
                pathname === href ? "bg-lavender text-brand" : "text-slate-600",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          {loading ? (
            <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
          ) : user ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-lavender"
                onClick={() => setProfile(!profile)}
              >
                <Image
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`
                  }
                  width={34}
                  height={34}
                  alt={user.name}
                  className="rounded-full"
                />
                <span className="max-w-24 truncate text-sm font-semibold">
                  {user.name}
                </span>
                <ChevronDown className="size-4" />
              </button>
              {profile && (
                <div className="absolute right-0 top-12 w-48 rounded-xl border bg-white p-2 shadow-xl">
                  <Link
                    href="/profile"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-lavender"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>
        <button
          className="grid size-10 place-items-center rounded-xl border lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="border-t bg-white p-4 lg:hidden">
          <div className="container grid gap-1">
            {links.map(([label, href]) => (
              <Link
                onClick={() => setOpen(false)}
                key={href}
                href={href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-lavender"
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <Link href="/profile" className="flex-1">
                    <Button variant="secondary" className="w-full">
                      Profile
                    </Button>
                  </Link>
                  <Button className="flex-1" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex-1">
                    <Button variant="secondary" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button className="w-full">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
export function Footer() {
  return (
    <footer className="mt-24 bg-navy text-slate-300">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
            A secure agentic AI workspace for creating content, understanding
            documents, finding insights, and choosing the right tools.
          </p>
          <a
            href="mailto:hello@intellihub.ai"
            className="mt-4 block text-sm text-white"
          >
            hello@intellihub.ai
          </a>
        </div>
        {[
          [
            "Explore",
            [
              ["All tools", "/explore"],
              ["Recommendations", "/recommendations"],
              ["AI chat", "/chat"],
            ],
          ],
          [
            "Company",
            [
              ["About", "/about"],
              ["Blog", "/blog"],
              ["Contact", "/contact"],
            ],
          ],
          [
            "Support",
            [
              ["Help center", "/help"],
              ["Privacy", "/privacy"],
              ["Terms", "/terms"],
            ],
          ],
        ].map(([title, items]) => (
          <div key={title as string}>
            <h4 className="font-bold text-white">{title as string}</h4>
            <div className="mt-4 grid gap-3">
              {(items as string[][]).map(([label, href]) => (
                <Link
                  className="text-sm hover:text-white"
                  key={href}
                  href={href}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 IntelliHub AI. All rights reserved.</span>
          <span>Built for useful, responsible AI work.</span>
        </div>
      </div>
    </footer>
  );
}
export function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.replace(
        `/login?next=${encodeURIComponent(window.location.pathname)}`,
      );
    }
  }, [loading, user]);

  if (loading || !user)
    return (
      <div className="container min-h-[60vh] animate-pulse py-20">
        <div className="h-10 w-56 rounded-xl bg-slate-200" />
      </div>
    );
  return children;
}
export function FloatingChat() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [welcome, setWelcome] = useState(true);

  if (["/chat", "/login", "/register"].includes(pathname)) return null;

  const href = user ? "/chat" : "/login?next=%2Fchat";

  return (
    <aside
      className="fixed bottom-5 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-7 sm:right-7"
      aria-label="Chat with IntelliHub AI"
    >
      {welcome && (
        <div className="chat-pop-in relative w-[min(330px,calc(100vw-2rem))] rounded-2xl border border-brand/15 bg-white p-4 pr-10 shadow-2xl shadow-brand/15">
          <button
            type="button"
            aria-label="Dismiss chat welcome"
            onClick={() => setWelcome(false)}
            className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-navy"
          >
            <X className="size-4" />
          </button>
          <div className="flex gap-3">
            <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-brand">
              <Bot className="size-5" />
              <i className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-emerald-400" />
            </span>
            <div>
              <strong className="text-sm text-navy">Hi! How can I help?</strong>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Ask our AI assistant anything about tools, content, or your
                workflow.
              </p>
              <Link
                href={href}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
              >
                Start a free chat <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
      <Link
        href={href}
        className="chat-attention group relative flex h-14 items-center gap-3 rounded-full bg-brand px-4 text-white shadow-[0_16px_45px_rgba(109,74,255,.38)] transition hover:-translate-y-1 hover:bg-[#5b39ee] sm:h-16 sm:px-5"
        aria-label="Chat now with the free AI assistant"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand/25 [animation-duration:2.4s]" />
        <span className="grid size-9 place-items-center rounded-full bg-white/16 sm:size-10">
          <MessageCircle className="size-5 fill-white/15" />
        </span>
        <span className="pr-1">
          <strong className="block text-sm leading-none sm:text-base">
            Chat now
          </strong>
          <span className="mt-1 block text-[10px] font-medium text-white/75 sm:text-xs">
            Free AI assistant
          </span>
        </span>
      </Link>
    </aside>
  );
}
export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <section className="border-b bg-gradient-to-b from-lavender/70 to-white">
      <div className="container py-14 text-center md:py-18">
        {eyebrow && (
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand shadow-sm">
            <Bot className="size-3.5" />
            {eyebrow}
          </span>
        )}
        <h1 className="mx-auto max-w-3xl text-3xl font-black tracking-tight text-navy md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-500">
          {description}
        </p>
      </div>
    </section>
  );
}
