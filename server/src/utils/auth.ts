import jwt, { type SignOptions } from "jsonwebtoken";
import { env, isProduction } from "../config/env.js";
import type { Response } from "express";

type Payload = { sub: string; role: "user" | "admin" };

export const signAccess = (payload: Payload) => jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] });
export const signRefresh = (payload: Payload) => jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] });
export const verifyAccess = (token: string) => jwt.verify(token, env.JWT_ACCESS_SECRET) as Payload;
export const verifyRefresh = (token: string) => jwt.verify(token, env.JWT_REFRESH_SECRET) as Payload;

export function setAuthCookies(res: Response, access: string, refresh: string) {
  const base = { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" as const : "lax" as const, path: "/" };
  res.cookie("ih_access", access, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie("ih_refresh", refresh, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("ih_access", { path: "/" });
  res.clearCookie("ih_refresh", { path: "/" });
}
