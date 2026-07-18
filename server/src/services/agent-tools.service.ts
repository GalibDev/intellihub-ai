import { Favorite, Tool, Activity } from "../models/index.js";
import type { Types } from "mongoose";

export async function buildToolContext(message: string, userId: Types.ObjectId) {
  const lower = message.toLowerCase();
  const categoryMap: Record<string, string> = { document: "Documents", content: "Content", image: "Images", data: "Data", chat: "Chat", recommend: "Recommendations" };
  const category = Object.entries(categoryMap).find(([term]) => lower.includes(term))?.[1];
  const filter: Record<string, unknown> = { isPublished: true };
  if (category) filter.category = category;
  const [tools, favorites, activity] = await Promise.all([
    Tool.find(filter).sort({ rating: -1, usageCount: -1 }).limit(8).lean(),
    Favorite.find({ user: userId }).select("tool").lean(),
    Activity.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  return {
    tools: tools.map((tool) => ({ id: tool._id, title: tool.title, slug: tool.slug, category: tool.category, price: tool.price, rating: tool.rating, features: tool.features })),
    favoriteToolIds: favorites.map((item) => item.tool), recentActivity: activity.map((item) => item.detail),
  };
}
