import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listSourceTypes } from "@/repositories/sales/crm/lead-sources";

export async function GET(req: Request) {
  try {
    await getTenantApiContext(P.sales.leads.read, { req });
    return apiSuccess(await listSourceTypes());
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
