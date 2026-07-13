import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/account-groups";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { searchParams } = new URL(req.url);
    const items = await repo.listAllAccountGroupsForExport(tenantId, {
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      groupType: searchParams.get("groupType") ?? undefined,
    });

    const header = ["Group Code", "Group Name", "Group Type", "Parent", "Status", "Accounts"];
    const rows = items.map((g) => [
      g.code,
      g.name,
      g.groupType,
      g.parentCode ? `${g.parentCode} - ${g.parentName}` : "",
      g.status === "ACTIVE" ? "Active" : "Inactive",
      String(g.accountCount),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="account-groups.csv"',
      },
    });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
