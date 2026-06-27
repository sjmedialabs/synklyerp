import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/sales/leads";
import { getLeadAttribution, listLeadActivities } from "@/repositories/sales/crm/lead-attribution";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const { id } = await params;
    const lead = await repo.getLead(tenantId, id);
    const [attribution, activities] = await Promise.all([
      getLeadAttribution(tenantId, id),
      listLeadActivities(tenantId, id),
    ]);
    return apiSuccess({ lead, attribution, activities });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
