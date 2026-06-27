import { apiError, apiSuccess } from "@/lib/api/response";
import { getTenantSubscriptionView } from "@/lib/platform/tenant-subscription-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.settings.read, { req });
    const view = await getTenantSubscriptionView(tenantId);
    return apiSuccess(view);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
