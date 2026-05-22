import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";
import { listUserPermissions } from "@/lib/rbac/permissions";

export async function GET() {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const permissions = await listUserPermissions(ctx.userId, ctx.role, tenantId);
    return apiSuccess({ permissions, role: ctx.role });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
