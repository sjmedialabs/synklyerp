#!/usr/bin/env node
/**
 * Verifies required Supabase tables/columns exist.
 * Usage: node scripts/check-migrations.mjs
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

const checks = [
  { label: "004 otp_verifications", table: "otp_verifications" },
  { label: "005 tenant_modules", table: "tenant_modules" },
  { label: "005 onboarding_completed_at", table: "tenants", column: "onboarding_completed_at" },
  { label: "006 auth_rate_limits", table: "auth_rate_limits" },
  { label: "006 refresh_tokens", table: "refresh_tokens" },
];

let failed = 0;

for (const c of checks) {
  if (c.column) {
    const { error } = await supabase.from(c.table).select(c.column).limit(1);
    if (error) {
      console.log("✗", c.label, "—", error.message);
      failed++;
    } else {
      console.log("✓", c.label);
    }
  } else {
    const { error } = await supabase.from(c.table).select("*").limit(1);
    if (error) {
      console.log("✗", c.label, "—", error.message);
      failed++;
    } else {
      console.log("✓", c.label);
    }
  }
}

if (failed) {
  console.log("\nApply migrations in supabase/migrations/ (004 → 008) in the Supabase SQL editor.");
  process.exit(1);
}

console.log("\nAll checked migrations are present.");
