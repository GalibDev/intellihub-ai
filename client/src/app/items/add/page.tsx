"use client";
import { Protected } from "@/components/site-shell";
import { ToolForm } from "@/components/tool-form";
export default function AddToolPage() { return <Protected><div className="container py-10"><h1 className="text-3xl font-black">Add a new AI tool</h1><p className="mt-2 text-slate-500">Share a useful capability with the IntelliHub community.</p><div className="mt-8"><ToolForm /></div></div></Protected>; }
