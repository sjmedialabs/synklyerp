import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listPendingFollowups } from "@/repositories/sales/crm/engagement";
import * as repo from "@/repositories/sales/leads";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.read, { req });
    const followups = await listPendingFollowups(ctx.tenantId, ctx.userId);
    const leads = await repo.listLeads(ctx.tenantId, {
      assignedTo: ctx.userId,
      limit: 8,
      page: 1,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    return apiSuccess({ leads: leads.items, followups });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
