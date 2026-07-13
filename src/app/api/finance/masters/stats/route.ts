import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { getFinanceMasterStats } from "@/repositories/finance/masters-stats";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const stats = await getFinanceMasterStats(tenantId);
    return apiSuccess(stats);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
