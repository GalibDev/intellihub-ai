import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  LineChart,
  MessageSquareText,
  Search,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { Capabilities, FeaturedTools, Hero, Newsletter } from "@/components/home-sections";

const toolHighlights = [
  [MessageSquareText, "AI Chat Assistant", "Grounded answers and route guidance"],
  [WandSparkles, "Content Generator", "On-brand content for five formats"],
  [FileSearch, "Document Intelligence", "Summaries, actions, and extracted facts"],
  [LineChart, "Data Analyzer", "Patterns and decision-ready insights"],
  [Bot, "Image Understanding", "Explain visual content clearly"],
  [BrainCircuit, "Smart Recommendations", "Tools ranked for your real goals"],
] as const;

const posts = [
  {
    slug: "choosing-the-right-ai-tool",
    title: "Choosing the Right AI Tool for Your Workflow",
    copy: "A practical framework for matching AI capabilities to business outcomes.",
    author: "Maya Rahman",
    read: "6 min",
  },
  {
    slug: "documents-to-decisions",
    title: "From Documents to Decisions in Minutes",
    copy: "Turn dense reports into focused, traceable next actions.",
    author: "Daniel Chen",
    read: "5 min",
  },
  {
    slug: "secure-agentic-tool-calling",
    title: "Why Agentic AI Needs Secure Tool Calling",
    copy: "How useful agents act without exposing your internal systems.",
    author: "Priya Sharma",
    read: "7 min",
  },
];
export default function Home() {
  return (
    <>
      <Hero />
      <section className="border-y bg-white">
        <div className="container py-7 text-center">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">
            Built to support modern teams at
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-x-12 gap-y-4 text-lg font-black text-slate-400">
            <span>Google</span>
            <span>Microsoft</span>
            <span>Slack</span>
            <span>Notion</span>
            <span>Spotify</span>
            <span>AWS</span>
          </div>
        </div>
      </section>
      <section id="tools" className="section">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Powerful AI tools for every need</h2>
            <p className="section-copy">
              Move from a question to useful work without juggling disconnected
              apps.
            </p>
          </div>
          <FeaturedTools />
          <div className="mt-8 text-center">
            <Link href="/explore">
              <Button variant="secondary">
                Browse all tools <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="section bg-lavender/55">
        <div className="container">
          <div className="text-center">
            <span className="text-sm font-bold text-brand">
              A simpler workflow
            </span>
            <h2 className="section-title mt-3">
              From intent to outcome in three steps
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [
                Search,
                "1. Tell us what you need",
                "Search directly or describe your goal to the assistant.",
              ],
              [
                SlidersHorizontal,
                "2. Get a grounded plan",
                "IntelliHub uses your context and retrieves matching tools.",
              ],
              [
                CheckCircle2,
                "3. Create and refine",
                "Run the tool, save the output, and improve it with feedback.",
              ],
            ].map(([Icon, title, copy]) => (
              <Card key={title as string} className="relative p-7">
                <Icon className="size-8 text-brand" />
                <h3 className="mt-5 text-lg font-bold">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {copy as string}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <span className="text-sm font-bold text-brand">
              Agentic by design
            </span>
            <h2 className="section-title mt-3">
              An assistant that knows when to look things up
            </h2>
            <p className="section-copy">
              It securely searches tools, considers favorites and recent
              activity, and grounds every recommendation in current workspace
              data.
            </p>
            <Link href="/chat">
              <Button className="mt-6">
                Meet your assistant <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
          <Capabilities />
        </div>
      </section>
      <section className="container">
        <div className="gradient-panel grid gap-px overflow-hidden rounded-3xl p-px text-white sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["10K+", "Active users"],
            ["50K+", "AI generations"],
            ["98%", "Satisfaction rate"],
            ["24/7", "Workspace support"],
          ].map(([value, label]) => (
            <div
              className="bg-white/5 p-7 text-center backdrop-blur"
              key={label}
            >
              <strong className="text-3xl font-black">{value}</strong>
              <span className="mt-1 block text-sm text-white/70">{label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">
              One workspace, six useful capabilities
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toolHighlights.map(([Icon, title, copy]) => (
              <Card className="p-6" key={title}>
                <Icon className="size-7 text-brand" />
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{copy}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="section bg-navy text-white">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title !text-white">
              What focused teams say
            </h2>
            <p className="mt-3 text-slate-400">
              Clearer workflows, faster first drafts, and decisions grounded in
              context.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [
                "Sarah Johnson",
                "Content Director",
                "IntelliHub transformed the way I create content. The chat assistant actually understands what I’m trying to achieve.",
              ],
              [
                "Michael Chen",
                "Data Analyst",
                "The document workflow turns long stakeholder reports into an actionable brief in minutes.",
              ],
              [
                "Priya Sharma",
                "Entrepreneur",
                "Recommendations feel specific to my budget and experience, not like a generic list of popular apps.",
              ],
            ].map(([name, role, quote]) => (
              <div
                key={name}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="text-amber-400">★★★★★</div>
                <p className="mt-4 leading-7 text-slate-300">“{quote}”</p>
                <strong className="mt-5 block">{name}</strong>
                <span className="text-xs text-slate-500">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">Latest practical AI guides</h2>
              <p className="section-copy">
                Useful ideas for building dependable AI workflows.
              </p>
            </div>
            <Link
              href="/blog"
              className="hidden text-sm font-bold text-brand sm:block"
            >
              View all articles →
            </Link>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.slug} className="p-6">
                <span className="text-xs font-bold text-brand">
                  INSIGHTS · {post.read}
                </span>
                <h3 className="mt-3 text-xl font-bold leading-7">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {post.copy}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    By {post.author}
                  </span>
                  <Link
                    className="text-sm font-bold text-brand"
                    href={`/blog/${post.slug}`}
                  >
                    Read more
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="section bg-lavender/55">
        <div className="container max-w-3xl">
          <div className="text-center">
            <h2 className="section-title">Frequently asked questions</h2>
          </div>
          <div className="mt-8 grid gap-3">
            {[
              [
                "What makes IntelliHub agentic?",
                "The assistant can choose secure server-side tools, retrieve relevant workspace data, and use it to complete a multi-step response.",
              ],
              [
                "Is my API key exposed to the browser?",
                "No. Gemini requests run only on the Express server, and secrets stay in server environment variables.",
              ],
              [
                "Which documents are supported?",
                "Document Intelligence supports PDF, DOCX, and TXT with configurable size limits and memory-only processing.",
              ],
              [
                "Can I start for free?",
                "Yes. Create an account, use the demo tools, save favorites, and explore personalized recommendations.",
              ],
            ].map(([q, a]) => (
              <details
                key={q}
                className="group rounded-2xl border bg-white p-5"
              >
                <summary className="cursor-pointer list-none font-bold">
                  {q}
                  <span className="float-right text-brand">+</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-500">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="gradient-panel rounded-3xl px-6 py-12 text-center text-white md:px-12">
            <Sparkles className="mx-auto size-8" />
            <h2 className="mt-4 text-3xl font-black md:text-4xl">
              Useful AI ideas, without the noise
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/75">
              Monthly product updates and practical ways to improve your AI
              workflows.
            </p>
            <Newsletter />
          </div>
        </div>
      </section>
      <section className="container pb-4">
        <div className="rounded-3xl bg-navy px-6 py-12 text-center text-white">
          <h2 className="text-3xl font-black">
            Ready to transform your workflow?
          </h2>
          <p className="mt-3 text-slate-400">
            Join thousands of users already working smarter with IntelliHub AI.
          </p>
          <Link href="/register">
            <Button className="mt-6 bg-white text-brand shadow-none hover:bg-lavender">
              Get started free <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
