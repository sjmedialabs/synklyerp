import fs from "fs";
import path from "path";

const apiRoot = path.join(process.cwd(), "src/app/api");

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name === "route.ts") files.push(p);
  }
  return files;
}

for (const file of walk(apiRoot)) {
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("getTenantApiContext")) continue;

  if (src.includes("getTenantApiContext(") && !src.includes("{ req }")) {
    src = src.replace(/getTenantApiContext\(([^)]+)\)/g, "getTenantApiContext($1, { req })");
  }

  if (src.includes("getTenantApiContext") && /export async function GET\(\)/.test(src)) {
    src = src.replace(/export async function GET\(\)/g, "export async function GET(req: Request)");
  }

  fs.writeFileSync(file, src);
  console.log("patched", path.relative(process.cwd(), file));
}
