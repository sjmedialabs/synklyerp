import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/finance/financial-dimensions";
import { dimensionValueSchema } from "@/validators/finance-masters";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.read, { req });
    const { id } = await params;
    const values = await repo.listDimensionValues(tenantId, id);
    return apiSuccess(values);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.finance.masters.create, { req });
    const { id } = await params;
    const body = dimensionValueSchema.parse(await req.json());
    const value = await repo.createDimensionValue(tenantId, id, {
      valueCode: body.valueCode,
      valueName: body.valueName,
      description: body.description,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    });
    return apiSuccess(value, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
