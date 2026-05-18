import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src/app/api");

const files = [
  "organisation/branches/[id]/route.ts",
  "organisation/divisions/[id]/route.ts",
  "organisation/designations/[id]/route.ts",
  "organisation/users/[id]/route.ts",
  "organisation/taxes/[id]/route.ts",
  "hr/employees/[id]/route.ts",
  "finance/services/[id]/route.ts",
  "finance/pricing/[id]/route.ts",
  "finance/packages/[id]/route.ts",
  "finance/sla/[id]/route.ts",
  "sales/leads/[id]/route.ts",
  "projects/[id]/route.ts",
];

const permPath = {
  "organisation/branches": "P.organisation.branches",
  "organisation/divisions": "P.organisation.divisions",
  "organisation/designations": "P.organisation.designations",
  "organisation/users": "P.organisation.users",
  "organisation/taxes": "P.organisation.taxes",
  "hr/employees": "P.hr.employees",
  "finance/services": "P.finance.services",
  "finance/pricing": "P.finance.pricing",
  "finance/packages": "P.finance.packages",
  "finance/sla": "P.finance.sla",
  "sales/leads": "P.sales.leads",
  "projects": "P.projects.projects",
};

for (const file of files) {
  const fp = path.join(root, file);
  let src = fs.readFileSync(fp, "utf8");
  if (src.includes("getTenantApiContext")) continue;

  const base = file.replace("/[id]/route.ts", "");
  const pBase = permPath[base];

  src = src.replace(
    /import \{ apiError, apiSuccess[^}]*\} from "@\/lib\/api\/response";\nimport \{ handleApiError, requireTenantSession, resolveTenantId \} from "@\/lib\/tenant\/context";/,
    (m) =>
      m.replace(
        'import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";',
        'import { handleApiError } from "@/lib/tenant/context";\nimport { getTenantApiContext } from "@/lib/rbac/api-guard";\nimport { P } from "@/lib/rbac/checks";'
      )
  );

  src = src.replace(
    /import \{ apiError, apiSuccess, parsePagination[^}]*\} from "@\/lib\/api\/response";\nimport \{ handleApiError, requireTenantSession, resolveTenantId \} from "@\/lib\/tenant\/context";/,
    (m) =>
      m.replace(
        'import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";',
        'import { handleApiError } from "@/lib/tenant/context";\nimport { getTenantApiContext } from "@/lib/rbac/api-guard";\nimport { P } from "@/lib/rbac/checks";'
      )
  );

  if (!src.includes("getTenantApiContext")) {
    src = src.replace(
      /import \{ handleApiError, requireTenantSession, resolveTenantId \} from "@\/lib\/tenant\/context";/,
      'import { handleApiError } from "@/lib/tenant/context";\nimport { getTenantApiContext } from "@/lib/rbac/api-guard";\nimport { P } from "@/lib/rbac/checks";'
    );
  }

  src = src.replace(
    /const ctx = await requireTenantSession\(\);\s*const tenantId = await resolveTenantId\(ctx\);/g,
    (match, offset) => {
      const after = src.slice(offset, offset + 400);
      if (after.includes("export async function GET")) {
        if (after.indexOf("export async function GET") < after.indexOf("export async function PATCH")) {
          return `const { tenantId } = await getTenantApiContext(${pBase}.read);`;
        }
      }
      return match;
    }
  );

  // Simpler: replace per method block
  src = src.replace(
    /(export async function GET[\s\S]*?try \{\s*)const ctx = await requireTenantSession\(\);\s*const tenantId = await resolveTenantId\(ctx\);/,
    `$1const { tenantId } = await getTenantApiContext(${pBase}.read);`
  );
  src = src.replace(
    /(export async function PATCH[\s\S]*?try \{\s*)const ctx = await requireTenantSession\(\);\s*const tenantId = await resolveTenantId\(ctx\);/,
    `$1const { tenantId } = await getTenantApiContext(${pBase}.update);`
  );
  src = src.replace(
    /(export async function DELETE[\s\S]*?try \{\s*)const ctx = await requireTenantSession\(\);\s*const tenantId = await resolveTenantId\(ctx\);/,
    `$1const { tenantId } = await getTenantApiContext(${pBase}.delete);`
  );

  fs.writeFileSync(fp, src);
  console.log("patched", file);
}
