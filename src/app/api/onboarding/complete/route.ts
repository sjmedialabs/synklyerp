import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { onboardingCompletionService } from "@/lib/onboarding/onboarding-completion-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { getOnboardingState } from "@/repositories/tenant/onboarding";
import { completeOnboardingSchema } from "@/validators/onboarding-session";

export async function POST(req: Request) {
  try {
    const { tenantId, userId, role } = await getTenantApiContext(P.tenant.onboarding.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only tenant admins can complete onboarding", 403, "FORBIDDEN");
    }

    const state = await getOnboardingState(tenantId);
    if (state.locked) {
      return apiError("Onboarding was already completed", 409, "ONBOARDING_LOCKED");
    }

    const body = completeOnboardingSchema.parse(await req.json());
    const result = await onboardingCompletionService.complete({
      tenantId,
      userId,
      payload: body,
    });

    return apiSuccess(result, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    if (error instanceof Error) {
      if (error.message === "ONBOARDING_LOCKED") {
        return apiError("Onboarding was already completed", 409, "ONBOARDING_LOCKED");
      }
      if (error.message === "INVALID_BUSINESS_SELECTION" || error.message === "INVALID_SPECIALIZATION") {
        return apiError("Invalid business selection", 400, error.message);
      }
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
