"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site-shell";
import { ToolCard } from "@/components/tool-card";
import { Button, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { api } from "@/services/api";
import type { Pagination, Tool } from "@/types";
export default function AiToolsPage() { const { data, isLoading, error, refetch } = useQuery({ queryKey: ["all-tools"], queryFn: () => api.get<{ items: Tool[]; pagination: Pagination }>("/tools?limit=40&sort=rating") }); return <><PageHero eyebrow="AI tool suite" title="Everything you need to work smarter" description="Choose a focused tool or ask the IntelliHub assistant to guide the whole workflow." /><div className="container py-12">{error ? <ErrorState message={error.message} retry={refetch} /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{isLoading ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[400px]" />) : data?.items.length ? data.items.map((tool) => <ToolCard key={tool._id} tool={tool} />) : <EmptyState />}</div>}<div className="mt-10 text-center"><Link href="/recommendations"><Button>Get a personal recommendation <ArrowRight className="size-4" /></Button></Link></div></div></>; }
