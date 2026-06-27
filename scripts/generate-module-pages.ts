/**
 * Generates missing /app/* module pages from sidebar menu catalog.
 * Run: npx tsx scripts/generate-module-pages.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { listAllModulePageDefinitions } from "../src/config/module-page-registry";

const appRoot = path.join(process.cwd(), "src/app/(dashboard)/app");

function pageFileForRoute(routePath: string) {
  const rel = routePath.replace(/^\/app\/?/, "");
  return rel ? path.join(appRoot, rel, "page.tsx") : path.join(appRoot, "page.tsx");
}

const SKIP = new Set([
  "/app/account/billing",
  "/app/account/subscription",
  "/app/setup/business-type",
  "/app/setup/organisation",
  "/app/setup/organisation/company-information",
  "/app/setup/organisation/branches",
]);

const SKIP_PREFIXES = ["/app/organisation/"];

function shouldSkip(def: { path: string; menuStatus: string }) {
  if (SKIP.has(def.path)) return true;
  if (SKIP_PREFIXES.some((p) => def.path.startsWith(p))) return true;
  if (def.menuStatus === "built") return true;
  return false;
}

function escapeJs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function placeholderPage(def: { path: string; title: string; description: string; menuStatus: string }) {
  const status = def.menuStatus === "scope" ? "scope" : "pending";
  return `"use client";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function Page() {
  return (
    <ModulePlaceholder
      title="${escapeJs(def.title)}"
      description="${escapeJs(def.description)}"
      status="${status}"
    />
  );
}
`;
}

let created = 0;
let skipped = 0;

for (const def of listAllModulePageDefinitions()) {
  if (shouldSkip(def)) {
    skipped += 1;
    continue;
  }

  const filePath = pageFileForRoute(def.path);
  if (existsSync(filePath)) {
    skipped += 1;
    continue;
  }

  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, placeholderPage(def), "utf8");
  created += 1;
  console.log("Created", def.path);
}

console.log(`Done. created=${created} skipped=${skipped}`);
