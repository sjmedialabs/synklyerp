import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateSuperAdminTenant } from "@/repositories/superadmin/tenants";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import { superAdminTenantPatchSchema } from "@/validators/superadmin-tenants";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const ctx = await requireSuperAdmin();
    const { id } = await context.params;
    const body = superAdminTenantPatchSchema.parse(await req.json());

    if (
      body.name === undefined &&
      body.status === undefined &&
      body.businessTypeSlug === undefined
    ) {
      return apiError("No fields to update", 400, "VALIDATION_ERROR");
    }

    const tenant = await updateSuperAdminTenant(id, ctx.userId, body);
    return apiSuccess(tenant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
