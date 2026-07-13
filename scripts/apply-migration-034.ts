import "./load-env";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: url,
    ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const migrationPath = path.join(
      process.cwd(),
      "supabase/migrations/034_finance_masters_extended.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");
    await client.query(sql);
    console.log("✓ Applied migration 034_finance_masters_extended.sql");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
