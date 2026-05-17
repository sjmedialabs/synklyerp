import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError, requireSession } from "@/lib/tenant/context";
import * as repo from "@/repositories/enterprise/notifications";

export async function GET(req: Request) {
  try {
    const ctx = await requireSession();
    const url = new URL(req.url);
    const params = parsePagination(url.searchParams);
    const status = url.searchParams.get("filter") ?? undefined;
    const result = await repo.listNotifications(ctx.userId, { ...params, status: status === "unread" ? "unread" : params.status });
    return apiSuccess(result.items, paginationMeta(result.total, result.page, result.limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
