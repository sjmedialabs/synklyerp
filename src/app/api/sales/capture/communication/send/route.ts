import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { sendTemplateToLead } from "@/lib/crm/communication-service";
import { z } from "zod";

const schema = z.object({
  leadId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.update, { req });
    const body = schema.parse(await req.json());
    const result = await sendTemplateToLead(ctx.tenantId, body.leadId, body.templateId, { actorId: ctx.userId });
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
