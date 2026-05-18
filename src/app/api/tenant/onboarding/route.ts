import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/tenant/onboarding";
import { onboardingDraftSchema } from "@/validators/onboarding";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.onboarding.read, { req });
    const state = await repo.getOnboardingState(tenantId);
    return apiSuccess(state);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.onboarding.update, { req });
    const body = onboardingDraftSchema.parse(await req.json());
    const result = await repo.saveOnboardingDraft(tenantId, body);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    if (error instanceof Error && error.message === "ONBOARDING_LOCKED") {
      return apiError("Onboarding is locked and cannot be changed", 409, "ONBOARDING_LOCKED");
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
