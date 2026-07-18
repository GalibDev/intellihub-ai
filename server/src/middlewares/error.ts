import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { ApiError } from "../utils/http.js";
import { isProduction } from "../config/env.js";

export const notFound: RequestHandler = (req, _res, next) => next(new ApiError(404, `Route ${req.method} ${req.originalUrl} was not found`));

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (!(error instanceof ApiError) && !(error instanceof ZodError)) console.error(error instanceof Error ? error.stack : error);
  let status = 500; let message = "Something went wrong"; let details: unknown;
  if (error instanceof ApiError) { status = error.statusCode; message = error.message; details = error.details; }
  else if (error instanceof ZodError) { status = 422; message = "Validation failed"; details = error.flatten(); }
  else if (error instanceof mongoose.Error.ValidationError) { status = 422; message = "Validation failed"; details = error.errors; }
  else if (error instanceof mongoose.Error.CastError) { status = 400; message = "Invalid identifier"; }
  else if (typeof error === "object" && error && "code" in error && error.code === 11000) { status = 409; message = "This record already exists"; }
  else if (error instanceof Error && !isProduction) { message = error.message; }
  res.status(status).json({ success: false, message, error: details || (isProduction ? undefined : error instanceof Error ? error.stack : error) });
};
