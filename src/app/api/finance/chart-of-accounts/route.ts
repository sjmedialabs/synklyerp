import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/chart-of-accounts";
import { chartOfAccountSchema } from "@/validators/finance-masters";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { searchParams } = new URL(req.url);
    const options = searchParams.get("options") === "true";
    const filters = searchParams.get("filters") === "true";

    if (options) {
      return apiSuccess(await repo.listChartOfAccountOptions(tenantId));
    }
    if (filters) {
      return apiSuccess(await repo.listCoaFilterOptions(tenantId));
    }

    const params = parsePagination(searchParams);
    const result = await repo.listChartOfAccounts(tenantId, {
      ...params,
      accountGroupId: searchParams.get("accountGroupId") ?? undefined,
      accountType: searchParams.get("accountType") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    return apiSuccess(result.items, paginationMeta(result.total, result.page, result.limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId, userId } = await getTenantApiContext(P.finance.masters.create, { req });
    const body = chartOfAccountSchema.parse(await req.json());
    const account = await repo.createChartOfAccount(tenantId, userId, {
      tenantId,
      ...body,
    });
    return apiSuccess(account, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
