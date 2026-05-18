import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/pricing";
import { pricingRuleSchema } from "@/validators/finance";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.pricing.update, { req });
    const { id } = await params;
    return apiSuccess(await repo.updatePricingRule(tenantId, id, pricingRuleSchema.partial().parse(await req.json())));
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.pricing.delete, { req });
    const { id } = await params;
    return apiSuccess(await repo.deletePricingRule(tenantId, id));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
