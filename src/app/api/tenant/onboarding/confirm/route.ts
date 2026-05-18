import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/tenant/onboarding";

export async function POST(req: Request) {
  try {
    const { tenantId, userId, role } = await getTenantApiContext(P.tenant.onboarding.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only tenant admins can confirm onboarding", 403, "FORBIDDEN");
    }
    const result = await repo.confirmOnboarding(tenantId, userId);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof Error && error.message === "ONBOARDING_LOCKED") {
      return apiError("Onboarding was already confirmed", 409, "ONBOARDING_LOCKED");
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
