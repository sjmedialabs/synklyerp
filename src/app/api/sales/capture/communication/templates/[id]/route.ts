import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { getTemplate, updateTemplate } from "@/repositories/sales/crm/communication";
import { crmMessageTemplateSchema } from "@/validators/crm";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read);
    const { id } = await params;
    return apiSuccess(await getTemplate(tenantId, id));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.update, { req });
    const { id } = await params;
    const body = crmMessageTemplateSchema.partial().parse(await req.json());
    return apiSuccess(await updateTemplate(tenantId, id, body));
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
