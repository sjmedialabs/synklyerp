import { apiError, apiSuccess } from "@/lib/api/response";
import { getModulePageDefinition } from "@/config/module-page-registry";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listModuleScopeItems } from "@/repositories/tenant/module-scope";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.settings.read, { req });
    const pagePath = new URL(req.url).searchParams.get("path");
    if (!pagePath?.startsWith("/app")) {
      return apiError("path query parameter is required", 400, "VALIDATION_ERROR");
    }

    const definition = getModulePageDefinition(pagePath);
    if (!definition) {
      return apiError("Unknown module page", 404, "NOT_FOUND");
    }

    const items = await listModuleScopeItems(tenantId, pagePath);
    return apiSuccess({ definition, items });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
