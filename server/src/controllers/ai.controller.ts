import type { Request, Response } from "express";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import {
  Activity,
  Conversation,
  Favorite,
  Generation,
  Message,
  Recommendation,
  RecommendationInteraction,
  Tool,
} from "../models/index.js";
import { generateText, parseAiJson } from "../services/ai.service.js";
import { buildToolContext } from "../services/agent-tools.service.js";
import {
  assistantSystemPrompt,
  recommendationSystemPrompt,
} from "../prompts/system.js";
import { ApiError, ok } from "../utils/http.js";

export async function listConversations(req: Request, res: Response) {
  return ok(
    res,
    await Conversation.find({ user: req.user!._id })
      .sort({ updatedAt: -1 })
      .lean(),
    "Conversations loaded",
  );
}
export async function createConversation(req: Request, res: Response) {
  const item = await Conversation.create({
    user: req.user!._id,
    title: req.body.title || "New conversation",
  });
  return ok(res, item, "Conversation created", 201);
}
export async function updateConversation(req: Request, res: Response) {
  const item = await Conversation.findOneAndUpdate(
    { _id: req.params.id, user: req.user!._id },
    { title: req.body.title },
    { new: true },
  );
  if (!item) throw new ApiError(404, "Conversation not found");
  return ok(res, item, "Conversation renamed");
}
export async function deleteConversation(req: Request, res: Response) {
  const item = await Conversation.findOneAndDelete({
    _id: req.params.id,
    user: req.user!._id,
  });
  if (!item) throw new ApiError(404, "Conversation not found");
  await Message.deleteMany({ conversationId: item._id });
  return ok(res, null, "Conversation deleted");
}
export async function getMessages(req: Request, res: Response) {
  const owned = await Conversation.exists({
    _id: req.params.id,
    user: req.user!._id,
  });
  if (!owned) throw new ApiError(404, "Conversation not found");
  return ok(
    res,
    await Message.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean(),
    "Messages loaded",
  );
}

export async function sendMessage(req: Request, res: Response) {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user!._id,
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");
  const content = String(req.body.content);
  await Message.create({
    conversationId: conversation._id,
    userId: req.user!._id,
    role: "user",
    content,
  });
  const history = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();
  const toolContext = await buildToolContext(content, req.user!._id);
  const transcript = history
    .reverse()
    .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
    .join("\n");
  const answer = await generateText(
    `USER_CONTEXT: ${JSON.stringify({ name: req.user!.name, preferences: req.user!.preferences })}\nTOOL_CONTEXT: ${JSON.stringify(toolContext)}\nRECENT_CONVERSATION:\n${transcript}\n\nRespond to the latest user message.`,
    assistantSystemPrompt,
  );
  const assistant = await Message.create({
    conversationId: conversation._id,
    userId: req.user!._id,
    role: "assistant",
    content: answer,
    metadata: { groundedToolIds: toolContext.tools.map((tool) => tool.id) },
  });
  if (conversation.title === "New conversation")
    conversation.title = content.slice(0, 60);
  await conversation.save();
  await Promise.all([
    Generation.create({
      user: req.user!._id,
      type: "chat",
      input: content,
      output: answer,
    }),
    Activity.create({
      user: req.user!._id,
      action: "chat.message",
      detail: `Asked IntelliHub Assistant: ${content.slice(0, 70)}`,
    }),
  ]);
  return ok(res, assistant, "Response generated", 201);
}

type RecommendationResult = {
  toolId: string;
  score: number;
  reason: string;
  relevantFeatures: string[];
};
export async function recommend(req: Request, res: Response) {
  const {
    goal = "Improve productivity",
    category = "Any",
    experienceLevel = "Intermediate",
    budget = "Flexible",
    outputPreference = "Practical",
    refinement = "",
  } = req.body as Record<string, string>;
  const priceFilter =
    budget === "Free"
      ? { price: 0 }
      : budget === "$1-$20"
        ? { price: { $lte: 20 } }
        : {};
  const categoryFilter =
    category && category !== "Any"
      ? {
          category: category as
            | "Content"
            | "Chat"
            | "Data"
            | "Documents"
            | "Images"
            | "Productivity"
            | "Recommendations",
        }
      : {};
  const candidates = await Tool.find({
    isPublished: true,
    ...categoryFilter,
    ...priceFilter,
  })
    .sort({ rating: -1, usageCount: -1 })
    .limit(12)
    .lean();
  if (!candidates.length)
    return ok(res, { results: [] }, "No matching tools found");
  const favorites = await Favorite.find({ user: req.user!._id })
    .select("tool")
    .lean();
  const [interactions, recentActivity] = await Promise.all([
    RecommendationInteraction.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Activity.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(12)
      .select("action detail tool")
      .lean(),
  ]);
  const feedbackWeights = new Map<string, number>();
  for (const item of interactions) {
    const id = String(item.tool);
    const weight =
      item.feedback === "saved" ? 8 : item.feedback === "helpful" ? 5 : -10;
    feedbackWeights.set(id, (feedbackWeights.get(id) || 0) + weight);
  }
  candidates.sort(
    (a, b) =>
      (feedbackWeights.get(String(b._id)) || 0) -
      (feedbackWeights.get(String(a._id)) || 0),
  );
  let ranked: RecommendationResult[];
  try {
    const ai = await generateText(
      `USER: ${JSON.stringify({ goal, category, experienceLevel, budget, outputPreference, refinement, favoriteToolIds: favorites.map((f) => f.tool), priorRecommendationFeedback: interactions.map((item) => ({ toolId: item.tool, feedback: item.feedback })), recentActivity })}\nCANDIDATES: ${JSON.stringify(candidates.map((t) => ({ id: t._id, title: t.title, category: t.category, price: t.price, rating: t.rating, features: t.features, description: t.shortDescription, feedbackWeight: feedbackWeights.get(String(t._id)) || 0 })))}`,
      recommendationSystemPrompt,
    );
    ranked = parseAiJson<{ results: RecommendationResult[] }>(ai).results;
  } catch {
    ranked = candidates.slice(0, 4).map((tool, index) => ({
      toolId: String(tool._id),
      score: 94 - index * 5,
      reason: `${tool.title} matches your ${goal.toLowerCase()} goal and ${experienceLevel.toLowerCase()} experience level.`,
      relevantFeatures: tool.features.slice(0, 3),
    }));
  }
  const valid = new Map(candidates.map((tool) => [String(tool._id), tool]));
  const results = ranked
    .filter((item) => valid.has(item.toolId))
    .slice(0, 4)
    .map((item) => ({ ...item, tool: valid.get(item.toolId) }));
  const saved = await Recommendation.create({
    user: req.user!._id,
    input: { goal, category, experienceLevel, budget, outputPreference },
    refinement,
    results: results.map((item) => ({
      tool: item.toolId,
      score: item.score,
      reason: item.reason,
      relevantFeatures: item.relevantFeatures,
    })),
  });
  await Activity.create({
    user: req.user!._id,
    action: "recommendation.created",
    detail: `Generated recommendations for ${goal}`,
  });
  return ok(res, { id: saved._id, results }, "Recommendations ready", 201);
}
export async function recommendationFeedback(req: Request, res: Response) {
  const item = await RecommendationInteraction.create({
    user: req.user!._id,
    recommendation: String(req.params.id),
    tool: req.body.toolId,
    feedback: req.body.feedback,
  });
  return ok(res, item, "Feedback saved", 201);
}

export async function generateContent(req: Request, res: Response) {
  const {
    contentType,
    topic,
    targetAudience,
    tone,
    keywords,
    outputLength,
    instructions,
    template,
  } = req.body;
  const prompt = `Create a ${outputLength} ${contentType} about "${topic}" for ${targetAudience}. Tone: ${tone}. Keywords: ${keywords || "none"}. Template: ${template || "standard"}. Additional instructions: ${instructions || "none"}. Return polished content only.`;
  const output = await generateText(
    prompt,
    "You are IntelliHub's expert content strategist. Produce original, accurate, structured content. Never mention that you are an AI.",
  );
  const saved = await Generation.create({
    user: req.user!._id,
    type: "content",
    title: `${contentType}: ${topic}`,
    input: req.body,
    output,
  });
  await Activity.create({
    user: req.user!._id,
    action: "content.generated",
    detail: `Generated ${contentType} about ${topic}`,
  });
  return ok(res, { id: saved._id, output }, "Content generated", 201);
}
export async function listGenerations(req: Request, res: Response) {
  return ok(
    res,
    await Generation.find({ user: req.user!._id, type: "content" })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    "Saved content loaded",
  );
}

async function extractDocument(file: Express.Multer.File) {
  if (file.mimetype === "text/plain") return file.buffer.toString("utf8");
  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return (await mammoth.extractRawText({ buffer: file.buffer })).value;
  if (file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      return (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  }
  throw new ApiError(415, "Only PDF, DOCX, and TXT files are supported");
}
export async function analyzeDocument(req: Request, res: Response) {
  if (!req.file) throw new ApiError(400, "Choose a document to analyze");
  const raw = await extractDocument(req.file);
  if (raw.trim().length < 20)
    throw new ApiError(
      422,
      "The document does not contain enough readable text",
    );
  const output = await generateText(
    `Analyze the document below. Return clear sections titled Executive Summary, Key Points, Action Items, and Extracted Information.\n\n${raw.slice(0, 80_000)}`,
    "You are a precise document intelligence analyst. Do not invent facts not found in the document.",
  );
  const saved = await Generation.create({
    user: req.user!._id,
    type: "document",
    title: req.file.originalname,
    input: { filename: req.file.originalname, size: req.file.size },
    output,
  });
  await Activity.create({
    user: req.user!._id,
    action: "document.analyzed",
    detail: `Analyzed ${req.file.originalname}`,
  });
  return ok(
    res,
    { id: saved._id, filename: req.file.originalname, report: output },
    "Document analyzed",
    201,
  );
}
