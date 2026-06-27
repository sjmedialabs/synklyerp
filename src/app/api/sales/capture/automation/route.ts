import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { createAutomationRule, listAutomationRules } from "@/repositories/sales/crm/automation";
import { z } from "zod";

const automationSchema = z.object({
  name: z.string().min(2),
  triggerEvent: z.string().min(2),
  conditions: z.array(z.record(z.string(), z.unknown())).optional(),
  actions: z.array(z.record(z.string(), z.unknown())).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    return apiSuccess(await listAutomationRules(tenantId));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.create, { req });
    const body = automationSchema.parse(await req.json());
    return apiSuccess(await createAutomationRule(tenantId, body), undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
