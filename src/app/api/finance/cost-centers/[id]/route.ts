import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/cost-centers";
import { costCenterSchema } from "@/validators/finance-masters";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { id } = await params;
    const costCenter = await repo.getCostCenterById(tenantId, id);
    if (!costCenter) return apiError("Cost center not found", 404, "NOT_FOUND");
    return apiSuccess(costCenter);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId, userId } = await getTenantApiContext(P.finance.masters.update, { req });
    const { id } = await params;
    const body = costCenterSchema.partial().parse(await req.json());
    const costCenter = await repo.updateCostCenter(tenantId, id, userId, {
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
    return apiSuccess(costCenter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.delete, { req });
    const { id } = await params;
    const result = await repo.deleteCostCenter(tenantId, id);
    return apiSuccess(result);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
