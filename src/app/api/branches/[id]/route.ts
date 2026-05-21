import { apiError, apiSuccess } from "@/lib/api/response";
import { branchSetupService } from "@/lib/organisation-setup/branch-setup-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { updateBranchSchema } from "@/validators/organisation-setup";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.branches.read, { req });
    const { id } = await params;
    const branch = await branchSetupService.getBranch(tenantId, id);
    return apiSuccess(branch);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId, userId, role } = await getTenantApiContext(P.organisation.branches.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only admins can update branches", 403, "FORBIDDEN");
    }
    const { id } = await params;
    const body = updateBranchSchema.parse(await req.json());
    const branch = await branchSetupService.updateBranch(tenantId, userId, id, body);
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
    const { tenantId, userId, role } = await getTenantApiContext(P.organisation.branches.delete, { req });
    if (role !== "ADMIN") {
      return apiError("Only admins can delete branches", 403, "FORBIDDEN");
    }
    const { id } = await params;
    const result = await branchSetupService.deleteBranch(tenantId, userId, id);
    return apiSuccess(result);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
