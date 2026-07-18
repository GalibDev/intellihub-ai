import type { Request, Response } from "express";
import slugify from "slugify";
import { Activity, Tool } from "../models/index.js";
import { ApiError, ok } from "../utils/http.js";

export async function listTools(req: Request, res: Response) {
  const { search = "", category, toolType, pricing, rating, sort = "newest", page = "1", limit = "12", mine } = req.query as Record<string, string | undefined>;
  const filter: Record<string, unknown> = mine === "true" && req.user ? { createdBy: req.user._id } : { isPublished: true };
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (toolType) filter.toolType = toolType;
  if (rating) filter.rating = { $gte: Number(rating) };
  if (pricing === "free") filter.price = 0;
  if (pricing === "paid") filter.price = { $gt: 0 };
  if (pricing?.includes("-")) { const [min, max] = pricing.split("-").map(Number); filter.price = { $gte: min, $lte: max }; }
  const sorts: Record<string, Record<string, 1 | -1>> = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, rating: { rating: -1 }, used: { usageCount: -1 }, "price-asc": { price: 1 }, "price-desc": { price: -1 } };
  const pageNumber = Math.max(1, Number(page)); const pageSize = Math.min(40, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([Tool.find(filter).sort(sorts[sort] || sorts.newest).skip((pageNumber - 1) * pageSize).limit(pageSize).lean(), Tool.countDocuments(filter)]);
  return ok(res, { items, pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) } }, "Tools loaded");
}

export async function getTool(req: Request, res: Response) {
  const tool = await Tool.findOne({ slug: req.params.slug, isPublished: true }).populate("createdBy", "name avatar").lean();
  if (!tool) throw new ApiError(404, "Tool not found");
  const related = await Tool.find({ _id: { $ne: tool._id }, category: tool.category, isPublished: true }).sort({ rating: -1 }).limit(4).lean();
  return ok(res, { tool, related }, "Tool loaded");
}

export async function getOwnedTool(req: Request, res: Response) {
  const tool = await Tool.findById(req.params.id).lean();
  if (!tool) throw new ApiError(404, "Tool not found");
  if (String(tool.createdBy) !== String(req.user!._id) && req.user!.role !== "admin") throw new ApiError(403, "You can only access your own tools");
  return ok(res, tool, "Tool loaded");
}

export async function createTool(req: Request, res: Response) {
  const baseSlug = slugify(req.body.title as string, { lower: true, strict: true });
  let slug = baseSlug; let suffix = 1;
  while (await Tool.exists({ slug })) slug = `${baseSlug}-${++suffix}`;
  const tool = await Tool.create({ ...req.body, slug, createdBy: req.user!._id });
  await Activity.create({ user: req.user!._id, action: "tool.created", detail: `Created ${tool.title}`, tool: tool._id });
  return ok(res, tool, "Tool created", 201);
}

export async function updateTool(req: Request, res: Response) {
  const tool = await Tool.findById(req.params.id);
  if (!tool) throw new ApiError(404, "Tool not found");
  if (String(tool.createdBy) !== String(req.user!._id) && req.user!.role !== "admin") throw new ApiError(403, "You can only edit your own tools");
  const protectedFields = ["createdBy", "rating", "reviewCount", "usageCount", "slug"];
  for (const field of protectedFields) delete req.body[field];
  Object.assign(tool, req.body); await tool.save();
  return ok(res, tool, "Tool updated");
}

export async function deleteTool(req: Request, res: Response) {
  const tool = await Tool.findById(req.params.id);
  if (!tool) throw new ApiError(404, "Tool not found");
  if (String(tool.createdBy) !== String(req.user!._id) && req.user!.role !== "admin") throw new ApiError(403, "You can only delete your own tools");
  await tool.deleteOne(); return ok(res, null, "Tool deleted");
}
