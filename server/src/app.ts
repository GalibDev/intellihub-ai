import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/error.js";
import { ApiError, asyncHandler } from "./utils/http.js";
import * as billing from "./controllers/billing.controller.js";

function assertSafeKeys(value: unknown): void {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes("."))
      throw new ApiError(400, "Request contains an unsafe field name");
    assertSafeKeys(nested);
  }
}

export const app = express();
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedClientOrigin = env.CLIENT_URL.replace(/\/+$/, "");
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.replace(/\/+$/, "") === allowedClientOrigin)
        callback(null, true);
      else callback(new ApiError(403, "Origin is not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(billing.webhook),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use((req, _res, next) => {
  try {
    assertSafeKeys(req.body);
    assertSafeKeys(req.params);
    next();
  } catch (error) {
    next(error);
  }
});
app.get("/health", (_req, res) =>
  res.json({
    success: true,
    message: "IntelliHub API is healthy",
    data: { timestamp: new Date().toISOString() },
  }),
);
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);
