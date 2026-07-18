import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function start() {
  await connectDatabase();
  const server = app.listen(env.PORT, () => console.info(`IntelliHub API running on http://localhost:${env.PORT}`));
  const shutdown = (signal: string) => { console.info(`${signal} received, closing server`); server.close(() => process.exit(0)); };
  process.on("SIGTERM", () => shutdown("SIGTERM")); process.on("SIGINT", () => shutdown("SIGINT"));
}
start().catch((error) => { console.error("Server failed to start", error); process.exit(1); });
