import { createApp } from "./app";
import { pool } from "./config/database";
import { env } from "./config/env";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`EstateHub API running on http://localhost:${env.PORT}`);
  console.log(`API docs:            http://localhost:${env.PORT}/api-docs`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
;;