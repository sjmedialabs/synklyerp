import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { createScoreRule, listScoreRules, updateScoreRule, seedDefaultScoreRules } from "@/repositories/sales/crm/scoring";
import { leadScoreRuleSchema } from "@/validators/crm";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const url = new URL(req.url);
    if (url.searchParams.get("seed") === "1") await seedDefaultScoreRules(tenantId);
    return apiSuccess(await listScoreRules(tenantId));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.create, { req });
    const body = leadScoreRuleSchema.parse(await req.json());
    return apiSuccess(await createScoreRule(tenantId, body), undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.update, { req });
    const body = z.object({ id: z.string().uuid(), ...leadScoreRuleSchema.partial().shape }).parse(await req.json());
    const { id, ...rest } = body;
    return apiSuccess(await updateScoreRule(tenantId, id, rest));
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
