import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import {
  getOnboardingSession,
  upsertOnboardingSession,
} from "@/repositories/provisioning/onboarding-sessions";
import { getOnboardingState } from "@/repositories/tenant/onboarding";
import { saveOnboardingStepSchema } from "@/validators/onboarding-session";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.onboarding.read, { req });
    const [session, state] = await Promise.all([
      getOnboardingSession(tenantId),
      getOnboardingState(tenantId),
    ]);

    return apiSuccess({
      session,
      completed: state.completed,
      locked: state.locked,
    });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.onboarding.update, { req });
    const state = await getOnboardingState(tenantId);
    if (state.locked) {
      return apiError("Onboarding is locked", 409, "ONBOARDING_LOCKED");
    }

    const body = saveOnboardingStepSchema.parse(await req.json());
    const session = await upsertOnboardingSession(tenantId, body);
    return apiSuccess(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
