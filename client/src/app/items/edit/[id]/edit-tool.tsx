"use client";
import { Protected } from "@/components/site-shell";
import { ToolForm } from "@/components/tool-form";
export function EditTool({ id }: { id: string }) { return <Protected><div className="container py-10"><h1 className="text-3xl font-black">Edit AI tool</h1><p className="mt-2 text-slate-500">Keep details accurate and useful for the community.</p><div className="mt-8"><ToolForm id={id} /></div></div></Protected>; }
