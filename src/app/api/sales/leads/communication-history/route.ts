import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listCommunicationHistory } from "@/repositories/sales/crm/communication-history";
import type { CommunicationChannel } from "@/repositories/sales/crm/communication-history";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.read, { req });
    const url = new URL(req.url);
    const pagination = parsePagination(url.searchParams);

    const channel = (url.searchParams.get("channel") ?? "all") as CommunicationChannel;
    const leadId = url.searchParams.get("leadId") ?? undefined;
    const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
    const dateTo = url.searchParams.get("dateTo") ?? undefined;
    const assignedToParam = url.searchParams.get("assignedTo") ?? undefined;
    const mine = url.searchParams.get("mine") === "1";

    const isAdmin = ctx.role === "ADMIN" || ctx.role === "SUPERADMIN";
    let assignedTo: string | undefined;
    if (isAdmin) {
      assignedTo = assignedToParam || (mine ? ctx.userId : undefined);
    } else {
      assignedTo = ctx.userId;
    }

    const result = await listCommunicationHistory(ctx.tenantId, {
      channel,
      assignedTo,
      leadId,
      search: pagination.search,
      dateFrom,
      dateTo,
      page: pagination.page,
      limit: pagination.limit,
      sortOrder: pagination.sortOrder,
    });

    return apiSuccess(result.items, paginationMeta(result.total, result.page, result.limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
