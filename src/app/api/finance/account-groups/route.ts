import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/account-groups";
import { accountGroupSchema } from "@/validators/finance-masters";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";
    const options = searchParams.get("options") === "true";

    if (options) {
      return apiSuccess(await repo.listParentGroupOptions(tenantId));
    }
    if (all) {
      return apiSuccess(await repo.listAllAccountGroups(tenantId));
    }

    const params = parsePagination(searchParams);
    const result = await repo.listAccountGroups(tenantId, {
      ...params,
      status: searchParams.get("status") ?? undefined,
      groupType: searchParams.get("groupType") ?? undefined,
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
    const body = accountGroupSchema.parse(await req.json());
    const group = await repo.createAccountGroup(tenantId, userId, {
      tenantId,
      parentId: body.parentId,
      code: body.code,
      name: body.name,
      description: body.description,
      groupType: body.groupType,
      status: body.status,
      allowManualMapping: body.allowManualMapping,
      budgetApplicable: body.budgetApplicable,
      showInReports: body.showInReports,
      costCenterApplicable: body.costCenterApplicable,
      profitCenterApplicable: body.profitCenterApplicable,
    });
    return apiSuccess(group, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
