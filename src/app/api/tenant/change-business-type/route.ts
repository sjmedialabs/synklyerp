import { apiError, apiSuccess } from "@/lib/api/response";
import { businessProvisioningService } from "@/lib/provisioning/business-provisioning-service";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import { changeBusinessTypeSchema } from "@/validators/provisioning";
import { z } from "zod";

export async function PATCH(req: Request) {
  try {
    const ctx = await requireSuperAdmin();
    const body = changeBusinessTypeSchema.parse(await req.json());
    const tenantId = new URL(req.url).searchParams.get("tenantId");
    if (!tenantId) {
      return apiError("tenantId query parameter is required", 400, "VALIDATION_ERROR");
    }

    const result = await businessProvisioningService.reprovisionTenant({
      tenantId,
      userId: ctx.userId,
      businessTypeId: body.business_type_id,
      businessSubcategoryId: body.business_subcategory_id,
      reason: body.reason,
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
