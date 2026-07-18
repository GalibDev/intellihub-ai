import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { User } from "../models/index.js";
import { ApiError, ok } from "../utils/http.js";
import { clearAuthCookies, setAuthCookies, signAccess, signRefresh, verifyRefresh } from "../utils/auth.js";

const safeUser = (user: { _id: unknown; name: string; email: string; avatar?: string | null; role: string }) => ({ id: user._id, name: user.name, email: user.email, avatar: user.avatar || undefined, role: user.role });
const hashRefreshToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function issueSession(res: Response, user: { _id: unknown; role: "user" | "admin" }) {
  const payload = { sub: String(user._id), role: user.role };
  const access = signAccess(payload); const refresh = signRefresh(payload);
  const refreshTokenHash = hashRefreshToken(refresh);
  await User.findByIdAndUpdate(user._id, { refreshTokenHash });
  setAuthCookies(res, access, refresh);
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  if (await User.exists({ email })) throw new ApiError(409, "An account with this email already exists");
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}` });
  await issueSession(res, user);
  return ok(res, safeUser(user), "Account created", 201);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email }).select("+password");
  const passwordMatches = user?.password ? await bcrypt.compare(password, user.password).catch(() => false) : false;
  if (!user || !passwordMatches) throw new ApiError(401, "Incorrect email or password");
  await issueSession(res, user);
  return ok(res, safeUser(user), "Welcome back");
}

export async function googleLogin(req: Request, res: Response) {
  if (!env.GOOGLE_CLIENT_ID) throw new ApiError(503, "Google sign-in is not configured");
  const ticket = await new OAuth2Client(env.GOOGLE_CLIENT_ID).verifyIdToken({ idToken: req.body.credential as string, audience: env.GOOGLE_CLIENT_ID });
  const profile = ticket.getPayload();
  if (!profile?.email || !profile.sub) throw new ApiError(401, "Google sign-in could not be verified");
  let user = await User.findOne({ $or: [{ email: profile.email }, { googleId: profile.sub }] });
  if (!user) user = await User.create({ name: profile.name || "IntelliHub user", email: profile.email, avatar: profile.picture, googleId: profile.sub });
  else if (!user.googleId) { user.googleId = profile.sub; await user.save(); }
  await issueSession(res, user);
  return ok(res, safeUser(user), "Signed in with Google");
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.ih_refresh as string | undefined;
  if (!token) throw new ApiError(401, "Session expired");
  const payload = verifyRefresh(token);
  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user?.refreshTokenHash || hashRefreshToken(token) !== user.refreshTokenHash) throw new ApiError(401, "Session is no longer valid");
  await issueSession(res, user);
  return ok(res, safeUser(user), "Session refreshed");
}

export async function logout(req: Request, res: Response) {
  if (req.user) await User.findByIdAndUpdate(req.user._id, { $unset: { refreshTokenHash: 1 } });
  clearAuthCookies(res); return ok(res, null, "Signed out");
}

export async function me(req: Request, res: Response) { return ok(res, safeUser(req.user!), "Profile loaded"); }
