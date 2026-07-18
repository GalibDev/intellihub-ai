import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Favorite, Review, Tool } from "../models/index.js";
import { ApiError, ok } from "../utils/http.js";

async function syncRating(toolId: string) {
  const [stats] = await Review.aggregate([{ $match: { tool: new mongoose.Types.ObjectId(toolId) } }, { $group: { _id: "$tool", rating: { $avg: "$rating" }, count: { $sum: 1 } } }]);
  await Tool.findByIdAndUpdate(toolId, { rating: stats?.rating || 0, reviewCount: stats?.count || 0 });
}
export async function listReviews(req: Request, res: Response) { return ok(res, await Review.find({ tool: req.params.toolId }).populate("user", "name avatar").sort({ createdAt: -1 }).lean(), "Reviews loaded"); }
export async function upsertReview(req: Request, res: Response) {
  const toolId = String(req.params.toolId);
  const review = await Review.findOneAndUpdate({ tool: toolId, user: req.user!._id }, { ...req.body, tool: toolId, user: req.user!._id }, { upsert: true, new: true, runValidators: true });
  await syncRating(toolId); return ok(res, review, "Review saved", 201);
}
export async function deleteReview(req: Request, res: Response) {
  const review = await Review.findById(req.params.id); if (!review) throw new ApiError(404, "Review not found");
  if (String(review.user) !== String(req.user!._id) && req.user!.role !== "admin") throw new ApiError(403, "You can only delete your own review");
  const toolId = String(review.tool); await review.deleteOne(); await syncRating(toolId); return ok(res, null, "Review deleted");
}
export async function listFavorites(req: Request, res: Response) { return ok(res, await Favorite.find({ user: req.user!._id }).populate("tool").sort({ createdAt: -1 }).lean(), "Favorites loaded"); }
export async function addFavorite(req: Request, res: Response) { const item = await Favorite.findOneAndUpdate({ user: req.user!._id, tool: req.params.toolId }, {}, { upsert: true, new: true, setDefaultsOnInsert: true }); return ok(res, item, "Added to favorites", 201); }
export async function removeFavorite(req: Request, res: Response) { await Favorite.deleteOne({ user: req.user!._id, tool: req.params.toolId }); return ok(res, null, "Removed from favorites"); }
