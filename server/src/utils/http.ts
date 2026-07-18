import type { NextFunction, Request, RequestHandler, Response } from "express";

export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const asyncHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => void Promise.resolve(handler(req, res, next)).catch(next);

export const ok = (res: Response, data: unknown, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });
