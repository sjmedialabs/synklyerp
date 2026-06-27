import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { createRoutingRule, listRoutingRules, updateRoutingRule } from "@/repositories/sales/crm/routing";
import { pipelineRuleSchema } from "@/validators/crm";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    return apiSuccess(await listRoutingRules(tenantId));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.create, { req });
    const body = pipelineRuleSchema.parse(await req.json());
    return apiSuccess(await createRoutingRule(tenantId, body), undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.update, { req });
    const body = z.object({ id: z.string().uuid(), ...pipelineRuleSchema.partial().shape }).parse(await req.json());
    const { id, ...rest } = body;
    return apiSuccess(await updateRoutingRule(tenantId, id, rest));
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
