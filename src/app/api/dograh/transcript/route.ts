import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { getCallLog, listCallLogsForLead } from "@/repositories/sales/crm/calls";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.read, { req });
    const url = new URL(req.url);
    const leadId = url.searchParams.get("leadId");
    const callId = url.searchParams.get("callId");

    if (callId) {
      const log = await getCallLog(ctx.tenantId, callId);
      return apiSuccess(log);
    }

    if (!leadId) return apiError("leadId or callId required", 400, "VALIDATION_ERROR");

    const logs = await listCallLogsForLead(ctx.tenantId, leadId);
    return apiSuccess({ items: logs });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
