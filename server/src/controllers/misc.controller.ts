import type { Request, Response } from "express";
import { Activity, Blog, Contact, Conversation, Favorite, Generation, Tool, User } from "../models/index.js";
import { ApiError, ok } from "../utils/http.js";

export async function dashboard(req: Request, res: Response) {
  const user = req.user!._id;
  const [totalTools, totalGenerations, savedTools, conversations, recent, categories, usage] = await Promise.all([
    Tool.countDocuments({ createdBy: user }), Generation.countDocuments({ user }), Favorite.countDocuments({ user }), Conversation.countDocuments({ user }),
    Activity.find({ user }).sort({ createdAt: -1 }).limit(8).lean(),
    Tool.aggregate([{ $match: { createdBy: user } }, { $group: { _id: "$category", value: { $sum: 1 } } }, { $project: { name: "$_id", value: 1, _id: 0 } }]),
    Generation.aggregate([{ $match: { user } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, generations: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $limit: 30 }, { $project: { date: "$_id", generations: 1, _id: 0 } }]),
  ]);
  const mostUsed = await Tool.find({ isPublished: true }).sort({ usageCount: -1 }).limit(5).select("title usageCount category").lean();
  return ok(res, { summary: { totalTools, totalGenerations, activeProjects: Math.min(totalTools, 8), savedTools, conversations }, recent, categories, usage, mostUsed }, "Dashboard loaded");
}
export async function submitContact(req: Request, res: Response) { return ok(res, await Contact.create(req.body), "Message received", 201); }
export async function listBlogs(_req: Request, res: Response) { return ok(res, await Blog.find({ isPublished: true }).sort({ publishedAt: -1 }).lean(), "Articles loaded"); }
export async function getBlog(req: Request, res: Response) { const item = await Blog.findOne({ slug: req.params.slug, isPublished: true }).lean(); if (!item) throw new ApiError(404, "Article not found"); return ok(res, item, "Article loaded"); }
export async function listUsers(req: Request, res: Response) { const page = Math.max(1, Number(req.query.page || 1)); const [items, total] = await Promise.all([User.find().select("-password -refreshTokenHash").skip((page - 1) * 20).limit(20).lean(), User.countDocuments()]); return ok(res, { items, total, page }, "Users loaded"); }
export async function updateProfile(req: Request, res: Response) { const allowed = { name: req.body.name, avatar: req.body.avatar, preferences: req.body.preferences }; const user = await User.findByIdAndUpdate(req.user!._id, allowed, { new: true, runValidators: true }).select("-password -refreshTokenHash"); return ok(res, user, "Profile updated"); }
