import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/financial-dimensions";
import { financialDimensionSchema } from "@/validators/finance-masters";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { id } = await params;
    const dimension = await repo.getFinancialDimensionById(tenantId, id);
    if (!dimension) return apiError("Dimension not found", 404, "NOT_FOUND");
    return apiSuccess(dimension);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId, userId } = await getTenantApiContext(P.finance.masters.update, { req });
    const { id } = await params;
    const body = financialDimensionSchema.partial().parse(await req.json());
    const dimension = await repo.updateFinancialDimension(tenantId, id, userId, {
      dimensionCode: body.dimensionCode,
      dimensionName: body.dimensionName,
      description: body.description,
      dataType: body.dataType,
      allowMultipleValues: body.allowMultipleValues,
      isActive: body.isActive,
    });
    return apiSuccess(dimension);
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
    const result = await repo.deleteFinancialDimension(tenantId, id);
    return apiSuccess(result);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
