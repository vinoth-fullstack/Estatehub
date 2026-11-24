
import fs from "node:fs/promises";
import path from "node:path";
import { pool, withTransaction } from "../src/config/database";
import { isProduction } from "../src/config/env";

const MIGRATIONS_DIRECTORY = path.resolve(__dirname, "../../database/migrations");

async function resetDatabase() {
  if (isProduction) throw new Error("Refusing to reset the database while NODE_ENV=production");
  console.log("Dropping and recreating the public schema...");
  await pool.query("DROP SCHEMA public CASCADE");
  await pool.query("CREATE SCHEMA public");
}

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      file_name   TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  const applied = new Set(
    (await pool.query<{ file_name: string; }>("SELECT file_name FROM schema_migrations")).rows.map((row) => row.file_name),
  );
  const files = (await fs.readdir(MIGRATIONS_DIRECTORY)).filter((file) => file.endsWith(".sql")).sort();

  let appliedCount = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await fs.readFile(path.join(MIGRATIONS_DIRECTORY, file), "utf8");
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (file_name) VALUES ($1)", [file]);
    });
    console.log(`  applied ${file}`);
    appliedCount += 1;
  }

  console.log(appliedCount === 0 ? "Database is already up to date." : `Applied ${appliedCount} migration(s).`);
}

async function main() {
  if (process.argv.includes("--reset")) await resetDatabase();
  await runMigrations();
}

main()
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
