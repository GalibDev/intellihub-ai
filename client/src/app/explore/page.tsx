"use client";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import {
  EmptyState,
  ErrorState,
  Input,
  Select,
  Skeleton,
  Button,
} from "@/components/ui";
import { ToolCard } from "@/components/tool-card";
import { api } from "@/services/api";
import type { Pagination, Tool } from "@/types";

const filters = {
  category: [
    "Content",
    "Chat",
    "Data",
    "Documents",
    "Images",
    "Productivity",
    "Recommendations",
  ],
  toolType: [
    "Generator",
    "Assistant",
    "Analyzer",
    "Classifier",
    "Recommendation Engine",
  ],
  pricing: ["free", "paid", "0-20", "20-50", "50-100"],
  rating: ["4", "3", "2"],
  sort: ["newest", "oldest", "rating", "used", "price-asc", "price-desc"],
};
function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = searchParams.toString();
  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      if (key !== "page") params.delete("page");
      router.replace(`${pathname}?${params}`);
    },
    [pathname, router, searchParams],
  );
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tools", query],
    queryFn: () =>
      api.get<{ items: Tool[]; pagination: Pagination }>(`/tools?${query}`),
  });
  const page = Number(searchParams.get("page") || 1);
  return (
    <>
      <section className="border-b bg-lavender/50">
        <div className="container py-12">
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Explore AI tools
          </h1>
          <p className="mt-3 text-slate-500">
            Find the right capability for your next piece of work.
          </p>
          <div className="relative mt-7 max-w-2xl">
            <Search className="absolute left-4 top-3.5 size-4 text-slate-400" />
            <Input
              defaultValue={searchParams.get("search") || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") update("search", e.currentTarget.value);
              }}
              placeholder="Search tools, capabilities, or tags…"
              className="h-12 pl-11"
            />
          </div>
        </div>
      </section>
      <div className="container grid gap-7 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Filters</h2>
            <button
              onClick={() => router.replace(pathname)}
              className="flex items-center gap-1 text-xs font-bold text-brand"
            >
              <RotateCcw className="size-3" />
              Reset
            </button>
          </div>
          {Object.entries(filters)
            .filter(([key]) => key !== "sort")
            .map(([key, values]) => (
              <label className="block" key={key}>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  {key === "toolType" ? "Tool type" : key}
                </span>
                <Select
                  value={searchParams.get(key) || ""}
                  onChange={(e) => update(key, e.target.value)}
                >
                  <option value="">All</option>
                  {values.map((value) => (
                    <option value={value} key={value}>
                      {key === "rating"
                        ? `${value}+ stars`
                        : value.replaceAll("-", " ")}
                    </option>
                  ))}
                </Select>
              </label>
            ))}
        </aside>
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              <strong className="text-navy">
                {data?.pagination.total ?? 0}
              </strong>{" "}
              tools found
            </p>
            <Select
              className="w-48"
              value={searchParams.get("sort") || "newest"}
              onChange={(e) => update("sort", e.target.value)}
            >
              {filters.sort.map((value) => (
                <option key={value} value={value}>
                  {
                    {
                      newest: "Newest",
                      oldest: "Oldest",
                      rating: "Highest rated",
                      used: "Most used",
                      "price-asc": "Price: low to high",
                      "price-desc": "Price: high to low",
                    }[value]
                  }
                </option>
              ))}
            </Select>
          </div>
          {error ? (
            <ErrorState message={error.message} retry={refetch} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }, (_, i) => (
                  <Skeleton className="h-[410px]" key={i} />
                ))
              ) : data?.items.length ? (
                data.items.map((tool) => (
                  <ToolCard key={tool._id} tool={tool} />
                ))
              ) : (
                <EmptyState
                  title="No matching tools"
                  description="Try a broader search or reset one of the filters."
                />
              )}
            </div>
          )}
          {data && data.pagination.pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => update("page", String(page - 1))}
              >
                Previous
              </Button>
              {Array.from(
                { length: Math.min(5, data.pagination.pages) },
                (_, index) => index + 1,
              ).map((item) => (
                <Button
                  key={item}
                  variant={page === item ? "primary" : "secondary"}
                  className="w-11 px-0"
                  onClick={() => update("page", String(item))}
                >
                  {item}
                </Button>
              ))}
              <Button
                variant="secondary"
                disabled={page >= data.pagination.pages}
                onClick={() => update("page", String(page + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="container py-12"><Skeleton className="h-[620px]" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}
