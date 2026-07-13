import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/cost-centers";
import { costCenterSchema } from "@/validators/finance-masters";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { searchParams } = new URL(req.url);
    const options = searchParams.get("options") === "true";

    if (options) {
      return apiSuccess(await repo.listParentCostCenterOptions(tenantId));
    }

    const params = parsePagination(searchParams);
    const result = await repo.listCostCenters(tenantId, {
      ...params,
      status: searchParams.get("status") ?? undefined,
      costCenterType: searchParams.get("costCenterType") ?? undefined,
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
    const body = costCenterSchema.parse(await req.json());
    const costCenter = await repo.createCostCenter(tenantId, userId, {
      tenantId,
      parentId: body.parentId,
      costCenterCode: body.costCenterCode,
      costCenterName: body.costCenterName,
      costCenterType: body.costCenterType,
      managerName: body.managerName,
      location: body.location,
      description: body.description,
      status: body.status,
      budgetAmount: body.budgetAmount,
      currency: body.currency,
      allowManualEntry: body.allowManualEntry,
      includeInBudget: body.includeInBudget,
      allowTransactions: body.allowTransactions,
      isBillable: body.isBillable,
    });
    return apiSuccess(costCenter, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
