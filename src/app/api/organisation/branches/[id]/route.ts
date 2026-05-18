import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/organisation/branches";
import { branchSchema } from "@/validators/organisation";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.branches.read, { req });
    const { id } = await params;
    const branch = await repo.getBranch(tenantId, id);
    return apiSuccess(branch);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.branches.update, { req });
    const { id } = await params;
    const body = branchSchema.partial().parse(await req.json());
    const branch = await repo.updateBranch(tenantId, id, body);
    return apiSuccess(branch);
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
    const { tenantId } = await getTenantApiContext(P.organisation.branches.delete, { req });
    const { id } = await params;
    const result = await repo.deleteBranch(tenantId, id);
    return apiSuccess(result);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
