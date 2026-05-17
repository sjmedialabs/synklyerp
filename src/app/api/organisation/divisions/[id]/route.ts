import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";
import * as repo from "@/repositories/organisation/divisions";
import { divisionSchema } from "@/validators/organisation";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const { id } = await params;
    const body = divisionSchema.partial().parse(await req.json());
    const division = await repo.updateDivision(tenantId, id, body);
    return apiSuccess(division);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const { id } = await params;
    const result = await repo.deleteDivision(tenantId, id);
    return apiSuccess(result);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
