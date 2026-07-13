import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/chart-of-accounts";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { searchParams } = new URL(req.url);
    const items = await repo.listAllChartOfAccountsForExport(tenantId, {
      search: searchParams.get("search") ?? undefined,
      accountGroupId: searchParams.get("accountGroupId") ?? undefined,
      accountType: searchParams.get("accountType") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    const header = [
      "Account Code",
      "Account Name",
      "Account Group",
      "Account Type",
      "Category",
      "Status",
      "Currency",
    ];
    const rows = items.map((a) => [
      a.accountCode,
      a.accountName,
      a.accountGroupName ?? "",
      a.accountType,
      a.accountCategory ?? "",
      a.isActive ? "Active" : "Inactive",
      a.currency,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="chart-of-accounts.csv"',
      },
    });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
