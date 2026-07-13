import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/dashboard";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.dashboard.read, { req });
    const [stats, modules, reports, activities] = await Promise.all([
      repo.getFinanceDashboardStats(tenantId),
      repo.listFinanceDashboardModules(tenantId),
      repo.listFinanceDashboardReports(tenantId),
      repo.listFinanceRecentActivities(tenantId),
    ]);

    return apiSuccess({ stats, modules, reports, activities });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
