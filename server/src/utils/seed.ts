import bcrypt from "bcrypt";
import { connectDatabase } from "../config/database.js";
import { Blog, Tool, User } from "../models/index.js";

const toolSeed = [
  ["AI Chat Assistant", "chat", "Assistant", 0, "Get grounded answers, route guidance, and context-aware follow-up support.", ["Context-aware conversations", "Secure tool lookup", "Conversation history"]],
  ["AI Content Generator", "Content", "Generator", 0, "Create polished blogs, emails, product copy, social posts, and documentation.", ["Five content formats", "Tone controls", "Save and export"]],
  ["AI Data Analyzer", "Data", "Analyzer", 29, "Turn complex datasets into clear patterns, summaries, and decision-ready insights.", ["Pattern detection", "Visual summaries", "Insight reports"]],
  ["AI Document Intelligence", "Documents", "Analyzer", 19, "Extract summaries, key points, action items, and facts from business documents.", ["PDF, DOCX and TXT", "Action extraction", "Downloadable reports"]],
  ["AI Image Understanding", "Images", "Analyzer", 19, "Understand scenes, objects, charts, and visual details with multimodal AI.", ["Object recognition", "Chart interpretation", "Accessible descriptions"]],
  ["Smart Recommendation Engine", "Recommendations", "Recommendation Engine", 0, "Find the right AI tools using your goals, history, experience, and budget.", ["Personal match scores", "Explainable ranking", "Feedback learning"]],
  ["AI Auto Classifier", "Productivity", "Classifier", 12, "Automatically label, route, and organize content using flexible taxonomies.", ["Custom labels", "Bulk classification", "Confidence scores"]],
  ["AI Report Generator", "Content", "Generator", 24, "Transform notes and findings into structured executive-ready reports.", ["Executive templates", "Evidence summaries", "TXT export"]],
] as const;

const images = [
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1633412802994-5c058f151b66?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=1200&q=85",
];

const blogs = [
  { title: "Choosing the Right AI Tool for Your Workflow", slug: "choosing-the-right-ai-tool", description: "A practical framework for matching AI capabilities to real business outcomes.", content: "AI tools create the most value when they solve a defined workflow problem. Start by mapping repetitive decisions, the data available, and the quality bar for output. Then compare tools using privacy, integration effort, explainability, and total cost—not novelty alone. IntelliHub's recommendation engine applies the same approach to rank tools for your context.", image: images[5], author: "Maya Rahman", readTime: 6 },
  { title: "From Documents to Decisions in Minutes", slug: "documents-to-decisions", description: "How document intelligence turns dense reports into focused next actions.", content: "Document intelligence combines text extraction with grounded language analysis. A useful system separates source facts from interpretation, identifies owners and deadlines, and preserves a clear path back to the original material. IntelliHub produces executive summaries, key points, action items, and extracted facts while keeping the uploaded file off permanent storage.", image: images[3], author: "Daniel Chen", readTime: 5 },
  { title: "Why Agentic AI Needs Secure Tool Calling", slug: "secure-agentic-tool-calling", description: "The architecture behind useful AI agents that can act without exposing your systems.", content: "An agent becomes useful when it can retrieve current data and choose the right operation. Those tools must execute on the server with authorization, validation, ownership checks, and narrow inputs. IntelliHub never allows the browser or model to query MongoDB directly; the assistant receives only the relevant, limited context returned by controlled services.", image: images[0], author: "Priya Sharma", readTime: 7 },
];

async function seed() {
  await connectDatabase();
  let demo = await User.findOne({ email: "demo@intellihub.ai" });
  if (!demo) demo = await User.create({ name: "Demo User", email: "demo@intellihub.ai", password: await bcrypt.hash("Demo12345!", 12), role: "user", avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Demo%20User" });
  else await User.findByIdAndUpdate(demo._id, { password: await bcrypt.hash("Demo12345!", 12) });
  for (let i = 0; i < toolSeed.length; i++) {
    const [title, rawCategory, toolType, price, shortDescription, features] = toolSeed[i]!;
    const category = rawCategory === "chat" ? "Chat" : rawCategory;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await Tool.findOneAndUpdate({ slug }, { title, slug, shortDescription, fullDescription: `${shortDescription} Built for secure, dependable work inside the IntelliHub AI workspace. Use it independently or combine it with recommendations and assistant guidance to move from intent to a useful result faster.`, category, toolType, price, priority: i < 2 ? "High" : "Medium", imageUrl: images[i], galleryImages: [images[i], images[(i + 2) % images.length]], features, rating: Number((4.6 + (i % 4) * 0.1).toFixed(1)), reviewCount: 42 + i * 13, createdBy: demo._id, isPublished: true, tags: [category.toLowerCase(), "ai", "productivity"], usageCount: 950 - i * 73 }, { upsert: true, runValidators: true });
  }
  for (const article of blogs) await Blog.findOneAndUpdate({ slug: article.slug }, article, { upsert: true, runValidators: true });
  console.info("Seed complete. Demo: demo@intellihub.ai / Demo12345!");
  process.exit(0);
}
seed().catch((error) => { console.error(error); process.exit(1); });
