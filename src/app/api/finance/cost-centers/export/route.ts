import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/cost-centers";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { searchParams } = new URL(req.url);
    const items = await repo.listAllCostCentersForExport(tenantId, {
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      costCenterType: searchParams.get("costCenterType") ?? undefined,
    });

    const header = [
      "Cost Center Code",
      "Cost Center Name",
      "Type",
      "Parent",
      "Manager",
      "Status",
      "Budget",
      "Currency",
    ];
    const rows = items.map((c) => [
      c.costCenterCode,
      c.costCenterName,
      c.costCenterType,
      c.parentCode ? `${c.parentCode} - ${c.parentName}` : "",
      c.managerName ?? "",
      c.status === "ACTIVE" ? "Active" : "Inactive",
      String(c.budgetAmount),
      c.currency,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="cost-centers.csv"',
      },
    });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
