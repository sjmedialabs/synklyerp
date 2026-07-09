import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/organisation/designations";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.designations.read, { req });
    const { searchParams } = new URL(req.url);
    const items = await repo.listAllDesignationsForExport(tenantId, {
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      department: searchParams.get("department") ?? undefined,
      gradeLevel: searchParams.get("gradeLevel") ?? undefined,
    });

    const header = ["Designation Name", "Department", "Grade Level", "Status", "Reports To", "Employees"];
    const rows = items.map((d) => [
      d.name,
      d.department ?? "",
      d.gradeLevel ?? "",
      d.status,
      d.reportsToName ?? "",
      String(d.employeeCount),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="designations.csv"',
      },
    });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
