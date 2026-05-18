import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/organisation/designations";
import { designationSchema } from "@/validators/organisation";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.designations.update, { req });
    const { id } = await params;
    const body = designationSchema.partial().parse(await req.json());
    const designation = await repo.updateDesignation(tenantId, id, body);
    return apiSuccess(designation);
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
    const { tenantId } = await getTenantApiContext(P.organisation.designations.delete, { req });
    const { id } = await params;
    const result = await repo.deleteDesignation(tenantId, id);
    return apiSuccess(result);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
