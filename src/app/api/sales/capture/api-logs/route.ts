import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listApiLogs } from "@/repositories/sales/crm/api-keys";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const url = new URL(req.url);
    const params = parsePagination(url.searchParams);
    const apiKeyId = url.searchParams.get("apiKeyId") ?? undefined;
    const result = await listApiLogs(tenantId, { ...params, apiKeyId });
    return apiSuccess(result.items, paginationMeta(result.total, result.page, result.limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
