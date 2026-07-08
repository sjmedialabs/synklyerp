import "./load-env";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const migrations = [
  "025_crm_dograh_calls.sql",
  "026_crm_dograh_config_property_fields.sql",
  "027_dograh_sidebar_menu.sql",
];

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
    for (const file of migrations) {
      const migrationPath = path.join(process.cwd(), "supabase/migrations", file);
      const sql = fs.readFileSync(migrationPath, "utf8");
      await client.query(sql);
      console.log(`✓ Applied migration ${file}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
