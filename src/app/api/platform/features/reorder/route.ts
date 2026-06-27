import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { reorderErpFeatures } from "@/lib/platform/erp-feature-service";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import { reorderFeaturesSchema } from "@/validators/platform-features";

export async function PATCH(req: Request) {
  try {
    const ctx = await requireSuperAdmin();
    const body = reorderFeaturesSchema.parse(await req.json());
    await reorderErpFeatures(body.items, ctx.userId);
    return apiSuccess({ reordered: body.items.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
