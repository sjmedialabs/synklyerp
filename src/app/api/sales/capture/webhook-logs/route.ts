import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listWebhookLogs } from "@/repositories/sales/crm/forms-webhooks";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const webhookId = new URL(req.url).searchParams.get("webhookId") ?? undefined;
    return apiSuccess(await listWebhookLogs(tenantId, webhookId));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
