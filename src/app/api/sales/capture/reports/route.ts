import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { getCrmReportSummary } from "@/repositories/sales/crm/pipelines";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    return apiSuccess(await getCrmReportSummary(tenantId));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
