import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { testWebhookDelivery } from "@/lib/crm/lead-ingestion-service";
import { updateWebhook } from "@/repositories/sales/crm/forms-webhooks";
import { crmWebhookSchema } from "@/validators/crm";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.update, { req });
    const { id } = await params;
    const body = crmWebhookSchema.partial().parse(await req.json());
    return apiSuccess(await updateWebhook(tenantId, id, body));
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.update, { req });
    const { id } = await params;
    const result = await testWebhookDelivery(tenantId, id);
    return apiSuccess(result);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
