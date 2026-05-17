import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError, requireSession, resolveTenantId } from "@/lib/tenant/context";
import * as repo from "@/repositories/enterprise/activity";

export async function GET(req: Request) {
  try {
    const ctx = await requireSession();
    const tenantId = ctx.role === "SUPERADMIN" ? null : await resolveTenantId(ctx);
    const url = new URL(req.url);
    const params = parsePagination(url.searchParams);
    const module = url.searchParams.get("module") ?? undefined;
    const result = await repo.listActivityLogs(tenantId, { ...params, module });
    return apiSuccess(result.items, paginationMeta(result.total, result.page, result.limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
