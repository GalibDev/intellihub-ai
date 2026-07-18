import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { env } from "../config/env.js";
import { asyncHandler, ApiError } from "../utils/http.js";
import { authenticate, optionalAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import * as auth from "../controllers/auth.controller.js";
import * as tools from "../controllers/tool.controller.js";
import * as social from "../controllers/social.controller.js";
import * as ai from "../controllers/ai.controller.js";
import * as misc from "../controllers/misc.controller.js";

const router = Router();
const body = (value: z.ZodType) => validate(z.object({ body: value, params: z.any(), query: z.any() }));
const credentials = z.object({ email: z.email().toLowerCase(), password: z.string().min(8).max(128) });
const toolInput = z.object({
  title: z.string().min(3).max(120), shortDescription: z.string().min(20).max(220), fullDescription: z.string().min(50).max(10000),
  category: z.enum(["Content", "Chat", "Data", "Documents", "Images", "Productivity", "Recommendations"]),
  toolType: z.enum(["Generator", "Assistant", "Analyzer", "Classifier", "Recommendation Engine"]), price: z.coerce.number().min(0).max(100000),
  priority: z.enum(["Low", "Medium", "High"]), imageUrl: z.url(), galleryImages: z.array(z.url()).max(8).default([]), features: z.array(z.string().min(2)).min(1).max(20), tags: z.array(z.string().min(1)).max(20), isPublished: z.boolean().optional(),
});

router.post("/auth/register", body(credentials.extend({ name: z.string().min(2).max(80) })), asyncHandler(auth.register));
router.post("/auth/login", body(credentials), asyncHandler(auth.login));
router.post("/auth/google", body(z.object({ credential: z.string().min(20) })), asyncHandler(auth.googleLogin));
router.post("/auth/refresh", asyncHandler(auth.refresh));
router.post("/auth/logout", optionalAuth, asyncHandler(auth.logout));
router.get("/auth/me", authenticate, asyncHandler(auth.me));

router.get("/tools", optionalAuth, asyncHandler(tools.listTools));
router.get("/tools/id/:id", authenticate, asyncHandler(tools.getOwnedTool));
router.get("/tools/:slug", asyncHandler(tools.getTool));
router.post("/tools", authenticate, body(toolInput), asyncHandler(tools.createTool));
router.patch("/tools/:id", authenticate, body(toolInput.partial()), asyncHandler(tools.updateTool));
router.delete("/tools/:id", authenticate, asyncHandler(tools.deleteTool));

router.get("/reviews/:toolId", asyncHandler(social.listReviews));
router.put("/reviews/:toolId", authenticate, body(z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().min(3).max(1200) })), asyncHandler(social.upsertReview));
router.delete("/reviews/item/:id", authenticate, asyncHandler(social.deleteReview));
router.get("/favorites", authenticate, asyncHandler(social.listFavorites));
router.post("/favorites/:toolId", authenticate, asyncHandler(social.addFavorite));
router.delete("/favorites/:toolId", authenticate, asyncHandler(social.removeFavorite));

router.get("/conversations", authenticate, asyncHandler(ai.listConversations));
router.post("/conversations", authenticate, body(z.object({ title: z.string().max(100).optional() })), asyncHandler(ai.createConversation));
router.patch("/conversations/:id", authenticate, body(z.object({ title: z.string().min(1).max(100) })), asyncHandler(ai.updateConversation));
router.delete("/conversations/:id", authenticate, asyncHandler(ai.deleteConversation));
router.get("/conversations/:id/messages", authenticate, asyncHandler(ai.getMessages));
router.post("/conversations/:id/messages", authenticate, body(z.object({ content: z.string().min(1).max(10000) })), asyncHandler(ai.sendMessage));

router.post("/recommendations", authenticate, body(z.object({ goal: z.string().min(3), category: z.string(), experienceLevel: z.string(), budget: z.string(), outputPreference: z.string(), refinement: z.string().optional() })), asyncHandler(ai.recommend));
router.post("/recommendations/:id/feedback", authenticate, body(z.object({ toolId: z.string(), feedback: z.enum(["helpful", "not-helpful", "saved"]) })), asyncHandler(ai.recommendationFeedback));
router.post("/content/generate", authenticate, body(z.object({ contentType: z.enum(["Blog post", "Product description", "Social media post", "Email", "Documentation"]), topic: z.string().min(3), targetAudience: z.string().min(2), tone: z.string().min(2), keywords: z.string().optional(), outputLength: z.enum(["Short", "Medium", "Long"]), instructions: z.string().max(2000).optional(), template: z.string().optional() })), asyncHandler(ai.generateContent));
router.get("/content", authenticate, asyncHandler(ai.listGenerations));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  const allowed = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new ApiError(415, "Only PDF, DOCX, and TXT files are supported"));
} });
router.post("/documents/analyze", authenticate, upload.single("file"), asyncHandler(ai.analyzeDocument));

router.get("/dashboard", authenticate, asyncHandler(misc.dashboard));
router.patch("/users/me", authenticate, body(z.object({ name: z.string().min(2).max(80).optional(), avatar: z.url().optional(), preferences: z.object({ goals: z.array(z.string()).optional(), categories: z.array(z.string()).optional(), experienceLevel: z.string().optional(), budget: z.string().optional(), outputPreference: z.string().optional() }).optional() })), asyncHandler(misc.updateProfile));
router.get("/users", authenticate, requireRole("admin"), asyncHandler(misc.listUsers));
router.post("/contact", body(z.object({ name: z.string().min(2).max(80), email: z.email(), subject: z.string().min(3).max(150), message: z.string().min(10).max(5000) })), asyncHandler(misc.submitContact));
router.get("/blogs", asyncHandler(misc.listBlogs));
router.get("/blogs/:slug", asyncHandler(misc.getBlog));

export default router;
