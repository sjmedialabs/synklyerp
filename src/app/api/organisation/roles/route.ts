import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listRoles } from "@/repositories/organisation/users";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.roles.read, { req });
    const roles = await listRoles(tenantId);
    return apiSuccess(roles);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
