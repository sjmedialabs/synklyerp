import { apiError, apiSuccess } from "@/lib/api/response";
import { businessProvisioningService } from "@/lib/provisioning/business-provisioning-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { getOnboardingState } from "@/repositories/tenant/onboarding";
import { businessProfileProvisionSchema } from "@/validators/provisioning";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { tenantId, userId, role } = await getTenantApiContext(P.tenant.onboarding.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only tenant admins can confirm business provisioning", 403, "FORBIDDEN");
    }

    const body = businessProfileProvisionSchema.parse(await req.json());
    const state = await getOnboardingState(tenantId);
    const draft = state.draft ?? undefined;

    const result = await businessProvisioningService.provisionTenant({
      tenantId,
      userId,
      businessTypeId: body.business_type_id,
      businessSubcategoryId: body.business_subcategory_id,
      draft,
    });

    return apiSuccess(result, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    if (error instanceof Error && error.message === "ONBOARDING_LOCKED") {
      return apiError("Onboarding was already completed", 409, "ONBOARDING_LOCKED");
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
