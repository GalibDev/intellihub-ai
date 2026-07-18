"use client";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock } from "lucide-react";
import { ErrorState, Skeleton } from "@/components/ui";
import { api } from "@/services/api";
import { date } from "@/lib/utils";
type Blog={title:string;description:string;content:string;image:string;author:string;publishedAt:string;readTime:number};
export function BlogArticle({slug}:{slug:string}){const query=useQuery({queryKey:["blog",slug],queryFn:()=>api.get<Blog>(`/blogs/${slug}`)});if(query.isLoading)return <div className="container py-12"><Skeleton className="h-[620px]"/></div>;if(query.error||!query.data)return <div className="container py-12"><ErrorState message={query.error?.message||"Article not found"}/></div>;const post=query.data;return <article><div className="container max-w-4xl py-10"><Link href="/blog" className="flex items-center gap-2 text-sm font-bold text-brand"><ArrowLeft className="size-4"/>Back to insights</Link><h1 className="mt-8 text-3xl font-black leading-tight tracking-tight md:text-5xl">{post.title}</h1><p className="mt-4 text-lg leading-8 text-slate-500">{post.description}</p><div className="mt-5 flex gap-5 text-sm text-slate-400"><span>By {post.author}</span><span>{date(post.publishedAt)}</span><span className="flex items-center gap-1"><Clock className="size-4"/>{post.readTime} min</span></div><div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-3xl"><Image src={post.image} fill priority className="object-cover" alt={post.title}/></div><div className="mx-auto mt-10 max-w-3xl whitespace-pre-line text-base leading-8 text-slate-700">{post.content}</div></div></article>}
