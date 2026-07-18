"use client";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock } from "lucide-react";
import { PageHero } from "@/components/site-shell";
import { Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { api } from "@/services/api";
import { date } from "@/lib/utils";
type Blog={_id:string;title:string;slug:string;description:string;image:string;author:string;publishedAt:string;readTime:number};
export default function BlogPage(){const query=useQuery({queryKey:["blogs"],queryFn:()=>api.get<Blog[]>("/blogs")});return <><PageHero eyebrow="IntelliHub insights" title="Practical guidance for useful AI work" description="Architecture, workflows, and decision frameworks for teams using AI responsibly."/><div className="container py-12">{query.isLoading?<div className="grid gap-6 md:grid-cols-3">{[1,2,3].map(x=><Skeleton key={x} className="h-[430px]"/>)}</div>:query.error?<ErrorState message={query.error.message} retry={query.refetch}/>:query.data?.length?<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{query.data.map(post=><Card key={post._id} className="group overflow-hidden"><div className="relative aspect-[16/10]"><Image src={post.image} fill className="object-cover transition group-hover:scale-105" alt={post.title}/></div><div className="p-6"><div className="flex items-center justify-between text-xs text-slate-400"><span>{date(post.publishedAt)}</span><span className="flex items-center gap-1"><Clock className="size-3"/>{post.readTime} min read</span></div><h2 className="mt-3 text-xl font-black leading-7">{post.title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{post.description}</p><div className="mt-5 flex items-center justify-between"><span className="text-xs text-slate-400">By {post.author}</span><Link href={`/blog/${post.slug}`} className="flex items-center gap-1 text-sm font-bold text-brand">Read more <ArrowRight className="size-3"/></Link></div></div></Card>)}</div>:<EmptyState title="Articles are coming soon"/>}</div></>}
