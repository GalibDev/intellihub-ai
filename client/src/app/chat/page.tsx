"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Check,
  Copy,
  Menu,
  MessageSquarePlus,
  Pencil,
  RefreshCw,
  Send,
  Square,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Protected } from "@/components/site-shell";
import { Button, Card, EmptyState, Input, Skeleton } from "@/components/ui";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/types";
const prompts = [
  "Help me choose the right AI tool",
  "Explain how the document analyzer works",
  "Recommend tools for content creation",
  "Guide me through uploading a report",
];
export default function ChatPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<Conversation[]>("/conversations"),
  });
  useEffect(() => {
    if (!selected && conversations.data?.[0])
      setSelected(conversations.data[0]._id);
  }, [conversations.data, selected]);
  const messages = useQuery({
    queryKey: ["messages", selected],
    enabled: !!selected,
    queryFn: () => api.get<Message[]>(`/conversations/${selected}/messages`),
  });
  useEffect(
    () => end.current?.scrollIntoView({ behavior: "smooth" }),
    [messages.data, sending],
  );
  const newChat = async () => {
    const item = await api.post<Conversation>("/conversations", {});
    await qc.invalidateQueries({ queryKey: ["conversations"] });
    setSelected(item._id);
    setSidebar(false);
  };
  const send = async (text = input) => {
    if (!text.trim() || sending) return;
    let id = selected;
    if (!id) {
      const item = await api.post<Conversation>("/conversations", {});
      id = item._id;
      setSelected(id);
    }
    setInput("");
    setSending(true);
    abort.current = new AbortController();
    qc.setQueryData<Message[]>(["messages", id], (old = []) => [
      ...old,
      {
        _id: `temp-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      await api.post(
        `/conversations/${id}/messages`,
        { content: text },
        abort.current.signal,
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["messages", id] }),
        qc.invalidateQueries({ queryKey: ["conversations"] }),
      ]);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not generate response",
        );
      await qc.invalidateQueries({ queryKey: ["messages", id] });
    } finally {
      setSending(false);
    }
  };
  const rename = async (item: Conversation) => {
    const title = window.prompt("Conversation title", item.title)?.trim();
    if (title) {
      await api.patch(`/conversations/${item._id}`, { title });
      await qc.invalidateQueries({ queryKey: ["conversations"] });
    }
  };
  const remove = async (item: Conversation) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    await api.delete(`/conversations/${item._id}`);
    if (selected === item._id) setSelected("");
    await qc.invalidateQueries({ queryKey: ["conversations"] });
  };
  const lastUser = messages.data
    ?.filter((m) => m.role === "user")
    .at(-1)?.content;
  return (
    <Protected>
      <div className="container py-6">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <h1 className="text-xl font-black">AI Chat Assistant</h1>
          <button
            onClick={() => setSidebar(true)}
            className="grid size-10 place-items-center rounded-xl border"
          >
            <Menu />
          </button>
        </div>
        <div className="grid min-h-[680px] overflow-hidden rounded-3xl border bg-white shadow-card lg:grid-cols-[270px_1fr]">
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-[70] w-[290px] border-r bg-white p-4 transition lg:static lg:z-auto lg:w-auto",
              sidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <strong>Conversations</strong>
              <button className="lg:hidden" onClick={() => setSidebar(false)}>
                <X />
              </button>
            </div>
            <Button onClick={newChat} className="w-full">
              <MessageSquarePlus className="size-4" />
              New chat
            </Button>
            <div className="mt-4 space-y-1 overflow-y-auto">
              {conversations.isLoading ? (
                <Skeleton className="h-12" />
              ) : (
                conversations.data?.map((item) => (
                  <div
                    key={item._id}
                    className={cn(
                      "group flex items-center rounded-xl",
                      selected === item._id
                        ? "bg-lavender text-brand"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <button
                      onClick={() => {
                        setSelected(item._id);
                        setSidebar(false);
                      }}
                      className="min-w-0 flex-1 truncate px-3 py-3 text-left text-sm font-medium"
                    >
                      {item.title}
                    </button>
                    <button
                      aria-label="Rename"
                      onClick={() => rename(item)}
                      className="p-1 opacity-50 hover:opacity-100"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      aria-label="Delete"
                      onClick={() => remove(item)}
                      className="mr-2 p-1 text-red-500 opacity-50 hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
          <section className="flex min-w-0 flex-col bg-slate-50/60">
            <header className="border-b bg-white px-6 py-4">
              <h1 className="font-bold">AI Chat Assistant</h1>
              <p className="text-xs text-slate-400">
                Context-aware and grounded in IntelliHub tools
              </p>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-7">
              {!messages.data?.length && !sending ? (
                <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center py-14 text-center">
                  <span className="grid size-16 place-items-center rounded-2xl bg-brand text-white shadow-brand">
                    <Bot className="size-8" />
                  </span>
                  <h2 className="mt-5 text-2xl font-black">
                    How can I help you today?
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Ask about IntelliHub tools, workflows, documents, or
                    recommendations.
                  </p>
                  <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
                    {prompts.map((prompt) => (
                      <button
                        onClick={() => send(prompt)}
                        className="rounded-xl border bg-white p-3 text-left text-sm hover:border-brand hover:text-brand"
                        key={prompt}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-5">
                  {messages.data?.map((message) => (
                    <div
                      key={message._id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" && "flex-row-reverse",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl",
                          message.role === "user"
                            ? "bg-navy text-white"
                            : "bg-brand text-white",
                        )}
                      >
                        {message.role === "user" ? (
                          <User className="size-4" />
                        ) : (
                          <Bot className="size-4" />
                        )}
                      </span>
                      <div
                        className={cn(
                          "group max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-7 whitespace-pre-wrap",
                          message.role === "user"
                            ? "rounded-tr-sm bg-brand text-white"
                            : "rounded-tl-sm border bg-white text-slate-700",
                        )}
                      >
                        {message.content}
                        {message.role === "assistant" && (
                          <div className="mt-2 flex gap-1 border-t pt-2 text-slate-400">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                toast.success("Copied");
                              }}
                              className="p-1 hover:text-brand"
                              aria-label="Copy response"
                            >
                              <Copy className="size-3.5" />
                            </button>
                            {message === messages.data?.at(-1) && lastUser && (
                              <button
                                onClick={() => send(lastUser)}
                                className="p-1 hover:text-brand"
                                aria-label="Regenerate"
                              >
                                <RefreshCw className="size-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
                        <Bot className="size-4" />
                      </span>
                      <div className="flex items-center gap-1 rounded-2xl border bg-white px-5 py-4">
                        <i className="size-2 animate-bounce rounded-full bg-brand" />
                        <i className="size-2 animate-bounce rounded-full bg-brand [animation-delay:120ms]" />
                        <i className="size-2 animate-bounce rounded-full bg-brand [animation-delay:240ms]" />
                      </div>
                    </div>
                  )}
                  <div ref={end} />
                </div>
              )}
            </div>
            <div className="border-t bg-white p-4">
              <div className="mx-auto flex max-w-3xl gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) send();
                  }}
                  placeholder="Type your message…"
                  disabled={sending}
                  className="h-12"
                />
                {sending ? (
                  <Button
                    variant="secondary"
                    onClick={() => abort.current?.abort()}
                    className="h-12 w-12 px-0"
                    aria-label="Stop generation"
                  >
                    <Square className="size-4 fill-current" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => send()}
                    disabled={!input.trim()}
                    className="h-12 w-12 px-0"
                    aria-label="Send"
                  >
                    <Send className="size-4" />
                  </Button>
                )}
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400">
                <Check className="mr-1 inline size-3" />
                Recent context is limited for privacy and performance.
              </p>
            </div>
          </section>
        </div>
      </div>
    </Protected>
  );
}
