import type { NextFunction, Request, Response } from "express";
import { User } from "../models/index.js";
import { ApiError, asyncHandler } from "../utils/http.js";
import { verifyAccess } from "../utils/auth.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.ih_access as string | undefined || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) throw new ApiError(401, "Please sign in to continue");
  const payload = verifyAccess(token);
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, "Account no longer exists");
  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.ih_access as string | undefined;
  if (token) {
    try { const payload = verifyAccess(token); req.user = await User.findById(payload.sub) || undefined; } catch { /* public request */ }
  }
  next();
});

export const requireRole = (role: "admin") => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== role) return next(new ApiError(403, "You do not have permission for this action"));
  next();
};
