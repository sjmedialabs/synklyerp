import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { getPayrollStats } from "@/repositories/hr/payroll";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.hr.payroll.read, { req });
    return apiSuccess(await getPayrollStats(tenantId));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
