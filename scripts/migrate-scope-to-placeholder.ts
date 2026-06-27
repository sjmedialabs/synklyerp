/**
 * Replaces ModuleScopePage stubs with ModulePlaceholder on non-built routes.
 * Run: npx tsx scripts/migrate-scope-to-placeholder.ts
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import path from "path";
import { getModulePageDefinition } from "../src/config/module-page-registry";

const appRoot = path.join(process.cwd(), "src/app/(dashboard)/app");

const SKIP = new Set([
  "/app/account/billing",
  "/app/account/subscription",
  "/app/setup/business-type",
  "/app/setup/organisation",
  "/app/setup/organisation/company-information",
  "/app/setup/organisation/branches",
]);
const SKIP_PREFIXES = ["/app/organisation/"];

function routeFromFile(filePath: string): string {
  const rel = path.relative(appRoot, filePath).replace(/\\/g, "/").replace(/\/page\.tsx$/, "");
  return rel ? `/app/${rel}` : "/app";
}

function shouldSkip(route: string, menuStatus?: string) {
  if (SKIP.has(route)) return true;
  if (SKIP_PREFIXES.some((p) => route.startsWith(p))) return true;
  if (menuStatus === "built") return true;
  return false;
}

function escapeJs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function placeholderPage(def: { title: string; description: string; menuStatus: string }) {
  const status = def.menuStatus === "scope" ? "scope" : "pending";
  const lines = [
    `"use client";`,
    ``,
    `import { ModulePlaceholder } from "@/components/shared/module-placeholder";`,
    ``,
    `export default function Page() {`,
    `  return (`,
    `    <ModulePlaceholder`,
    `      title="${escapeJs(def.title)}"`,
  ];
  if (def.description) {
    lines.push(`      description="${escapeJs(def.description)}"`);
  }
  lines.push(`      status="${status}"`, `    />`, `  );`, `}`, ``);
  return lines.join("\n");
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (name === "page.tsx") acc.push(full);
  }
  return acc;
}

let updated = 0;
let skipped = 0;

for (const filePath of walk(appRoot)) {
  const content = readFileSync(filePath, "utf8");
  if (!content.includes("ModuleScopePage")) {
    skipped += 1;
    continue;
  }

  const route = routeFromFile(filePath);
  const def = getModulePageDefinition(route);
  if (!def || shouldSkip(route, def.menuStatus)) {
    skipped += 1;
    continue;
  }

  writeFileSync(filePath, placeholderPage(def), "utf8");
  updated += 1;
  console.log("Updated", route);
}

console.log(`Done. updated=${updated} skipped=${skipped}`);
