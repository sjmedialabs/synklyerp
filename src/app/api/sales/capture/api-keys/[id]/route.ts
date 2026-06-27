import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { revokeApiKey } from "@/repositories/sales/crm/api-keys";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.update, { req });
    const { id } = await params;
    const body = (await req.json()) as { action?: string };
    if (body.action === "revoke") {
      return apiSuccess(await revokeApiKey(tenantId, id));
    }
    return apiError("Unsupported action", 400, "VALIDATION_ERROR");
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
