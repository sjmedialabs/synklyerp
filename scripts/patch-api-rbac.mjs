import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src/app/api");

const routePerms = [
  ["organisation/branches/route.ts", { GET: "read", POST: "create" }],
  ["organisation/branches/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["organisation/divisions/route.ts", { GET: "read", POST: "create" }],
  ["organisation/divisions/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["organisation/designations/route.ts", { GET: "read", POST: "create" }],
  ["organisation/designations/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["organisation/users/route.ts", { GET: "read", POST: "create" }],
  ["organisation/users/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["organisation/users/stats/route.ts", { GET: "read" }],
  ["organisation/taxes/route.ts", { GET: "read", POST: "create" }],
  ["organisation/taxes/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["organisation/roles/route.ts", { GET: "read" }],
  ["hr/employees/route.ts", { GET: "read", POST: "create" }],
  ["hr/employees/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["hr/employees/stats/route.ts", { GET: "read" }],
  ["hr/attendance/route.ts", { GET: "read", POST: "create" }],
  ["hr/attendance/summary/route.ts", { GET: "read" }],
  ["hr/payroll/cycles/route.ts", { GET: "read" }],
  ["finance/services/route.ts", { GET: "read", POST: "create" }],
  ["finance/services/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["finance/pricing/route.ts", { GET: "read", POST: "create" }],
  ["finance/pricing/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["finance/packages/route.ts", { GET: "read", POST: "create" }],
  ["finance/packages/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["finance/sla/route.ts", { GET: "read", POST: "create" }],
  ["finance/sla/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["sales/leads/route.ts", { GET: "read", POST: "create" }],
  ["sales/leads/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["sales/leads/stats/route.ts", { GET: "read" }],
  ["projects/route.ts", { GET: "read", POST: "create" }],
  ["projects/[id]/route.ts", { GET: "read", PATCH: "update", DELETE: "delete" }],
  ["projects/stats/route.ts", { GET: "read" }],
  ["tenant/onboarding/route.ts", { GET: "read", PATCH: "update" }],
];

const permPath = {
  "organisation/branches": "P.organisation.branches",
  "organisation/divisions": "P.organisation.divisions",
  "organisation/designations": "P.organisation.designations",
  "organisation/users": "P.organisation.users",
  "organisation/taxes": "P.organisation.taxes",
  "organisation/roles": "P.organisation.roles",
  "hr/employees": "P.hr.employees",
  "hr/attendance": "P.hr.attendance",
  "hr/payroll/cycles": "P.hr.payroll",
  "finance/services": "P.finance.services",
  "finance/pricing": "P.finance.pricing",
  "finance/packages": "P.finance.packages",
  "finance/sla": "P.finance.sla",
  "sales/leads": "P.sales.leads",
  "projects": "P.projects.projects",
  "tenant/onboarding": "P.tenant.onboarding",
};

function baseKey(file) {
  return file.replace("/route.ts", "").replace("/[id]/route.ts", "").replace("/stats/route.ts", "").replace("/summary/route.ts", "");
}

for (const [file, methods] of routePerms) {
  const fp = path.join(root, file);
  if (!fs.existsSync(fp)) {
    console.warn("skip", file);
    continue;
  }
  let src = fs.readFileSync(fp, "utf8");
  if (src.includes("getTenantApiContext")) {
    console.log("already", file);
    continue;
  }

  src = src.replace(
    /import \{ handleApiError, requireTenantSession, resolveTenantId \} from "@\/lib\/tenant\/context";/,
    'import { handleApiError } from "@/lib/tenant/context";\nimport { getTenantApiContext } from "@/lib/rbac/api-guard";\nimport { P } from "@/lib/rbac/checks";'
  );

  const key = baseKey(file);
  let pBase = permPath[key];
  if (!pBase) {
    if (file.includes("users/stats")) pBase = "P.organisation.users";
    else if (file.includes("employees/stats")) pBase = "P.hr.employees";
    else if (file.includes("leads/stats")) pBase = "P.sales.leads";
    else if (file.includes("projects/stats")) pBase = "P.projects.projects";
    else if (file.includes("attendance/summary")) pBase = "P.hr.attendance";
    else {
      console.warn("no perm", file);
      continue;
    }
  }

  for (const [method, action] of Object.entries(methods)) {
    const permExpr = `${pBase}.${action}`;
    const re = new RegExp(
      `(export async function ${method}[\\s\\S]*?try \\{\\s*)const ctx = await requireTenantSession\\(\\);\\s*const tenantId = await resolveTenantId\\(ctx\\);`,
      "m"
    );
    src = src.replace(re, `$1const { tenantId } = await getTenantApiContext(${permExpr});`);
  }

  fs.writeFileSync(fp, src);
  console.log("patched", file);
}
