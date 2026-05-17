import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";
import * as repo from "@/repositories/hr/attendance";

export async function GET(req: Request) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const date = new URL(req.url).searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
    return apiSuccess(await repo.getAttendanceSummary(tenantId, date));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
