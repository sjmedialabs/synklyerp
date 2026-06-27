import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  deleteErpFeature,
  getErpFeatureById,
  updateErpFeature,
} from "@/lib/platform/erp-feature-service";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import { erpFeatureSchema } from "@/validators/platform-features";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    await requireSuperAdmin();
    const { id } = await context.params;
    const feature = await getErpFeatureById(id);
    if (!feature) return apiError("Feature not found", 404, "NOT_FOUND");
    return apiSuccess(feature);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const ctx = await requireSuperAdmin();
    const { id } = await context.params;
    const body = erpFeatureSchema.parse(await req.json());
    const feature = await updateErpFeature(id, body, ctx.userId);
    return apiSuccess(feature);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const ctx = await requireSuperAdmin();
    const { id } = await context.params;
    await deleteErpFeature(id, ctx.userId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
