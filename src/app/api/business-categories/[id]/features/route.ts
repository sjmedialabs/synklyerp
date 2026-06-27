import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  buildFeatureTree,
  getCategoryAssignments,
  replaceCategoryAssignments,
} from "@/lib/provisioning/category-feature-service";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import { replaceCategoryFeaturesSchema } from "@/validators/category-features";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const [tree, assignments] = await Promise.all([buildFeatureTree(), getCategoryAssignments(id)]);
    const enabledMenuIds = assignments.filter((a) => a.isEnabled).map((a) => a.menuId);
    return apiSuccess({ tree, enabledMenuIds, assignments });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const ctx = await requireSuperAdmin();
    const { id } = await context.params;
    const body = replaceCategoryFeaturesSchema.parse(await req.json());
    await replaceCategoryAssignments(id, body.assignments, ctx.userId);
    const assignments = await getCategoryAssignments(id);
    return apiSuccess({
      enabledMenuIds: assignments.filter((a) => a.isEnabled).map((a) => a.menuId),
      assignments,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
