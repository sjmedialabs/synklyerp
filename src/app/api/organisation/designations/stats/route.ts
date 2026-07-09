import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/organisation/designations";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.designations.read, { req });
    const stats = await repo.getDesignationStats(tenantId);
    const filters = await repo.listDesignationFilterOptions(tenantId);
    return apiSuccess({ ...stats, filters });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
