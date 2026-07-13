import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/financial-dimensions";
import { financialDimensionSchema } from "@/validators/finance-masters";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { searchParams } = new URL(req.url);
    const params = parsePagination(searchParams);
    const result = await repo.listFinancialDimensions(tenantId, {
      ...params,
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
    const body = financialDimensionSchema.parse(await req.json());
    const dimension = await repo.createFinancialDimension(tenantId, userId, {
      tenantId,
      dimensionCode: body.dimensionCode,
      dimensionName: body.dimensionName,
      description: body.description,
      dataType: body.dataType,
      allowMultipleValues: body.allowMultipleValues,
      isActive: body.isActive,
    });
    return apiSuccess(dimension, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
