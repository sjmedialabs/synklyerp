import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  buildAssignmentFeatureTree,
  getCategoryAssignments,
  replaceCategoryAssignments,
} from "@/lib/provisioning/category-feature-service";
import { resolveBusinessTypeRef } from "@/repositories/provisioning/business-types";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import { replaceCategoryFeaturesSchema } from "@/validators/category-features";

type RouteContext = { params: Promise<{ slug: string }> };

async function resolveTypeId(slug: string) {
  const type = await resolveBusinessTypeRef(slug);
  if (!type) throw new Error("NOT_FOUND");
  return type.id;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    await requireSuperAdmin();
    const { slug } = await context.params;
    const typeId = await resolveTypeId(slug);
    const [tree, assignments] = await Promise.all([
      buildAssignmentFeatureTree(),
      getCategoryAssignments(typeId),
    ]);
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
    const { slug } = await context.params;
    const typeId = await resolveTypeId(slug);
    const body = replaceCategoryFeaturesSchema.parse(await req.json());
    await replaceCategoryAssignments(typeId, body.assignments, ctx.userId);
    const assignments = await getCategoryAssignments(typeId);
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
