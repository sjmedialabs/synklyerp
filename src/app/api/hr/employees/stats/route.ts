import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";
import * as repo from "@/repositories/hr/employees";

export async function GET() {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    return apiSuccess(await repo.getEmployeeStats(tenantId));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
