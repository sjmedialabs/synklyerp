import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/account-groups";
import { accountGroupSchema } from "@/validators/finance-masters";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { id } = await params;
    const group = await repo.getAccountGroupById(tenantId, id);
    if (!group) return apiError("Account group not found", 404, "NOT_FOUND");
    return apiSuccess(group);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId, userId } = await getTenantApiContext(P.finance.masters.update, { req });
    const { id } = await params;
    const body = accountGroupSchema.partial().parse(await req.json());
    const group = await repo.updateAccountGroup(tenantId, id, userId, {
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
    return apiSuccess(group);
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
    const result = await repo.deleteAccountGroup(tenantId, id);
    return apiSuccess(result);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
