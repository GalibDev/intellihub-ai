import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/intellihub-ai"),
  JWT_ACCESS_SECRET: z.string().min(32).default("dev-access-secret-change-me-123456789"),
  JWT_REFRESH_SECRET: z.string().min(32).default("dev-refresh-secret-change-me-12345678"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  AI_PROVIDER: z.enum(["walkai", "gemini"]).default("walkai"),
  WALKAI_API_KEY: z.string().default(""),
  WALKAI_BASE_URL: z.url().default("https://walkai.top/v1"),
  WALKAI_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_API_KEY: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().default(""),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(10),
});

export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
