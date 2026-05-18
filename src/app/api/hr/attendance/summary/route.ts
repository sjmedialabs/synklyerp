import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/hr/attendance";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.hr.attendance.read, { req });
    const date = new URL(req.url).searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
    return apiSuccess(await repo.getAttendanceSummary(tenantId, date));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
