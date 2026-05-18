import { apiError, apiSuccess } from "@/lib/api/response";
import { listUserPermissions } from "@/lib/rbac/permissions";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { handleApiError } from "@/lib/tenant/context";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantApiContext();
    const permissions = await listUserPermissions(ctx.userId, ctx.role, ctx.tenantId);
    return apiSuccess({ permissions, role: ctx.role });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
