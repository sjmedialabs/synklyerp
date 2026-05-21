import { apiError, apiSuccess } from "@/lib/api/response";
import { branchSetupService } from "@/lib/organisation-setup/branch-setup-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { validateBranchCodeSchema } from "@/validators/organisation-setup";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.branches.create, { req });
    const body = validateBranchCodeSchema.parse(await req.json());
    const result = await branchSetupService.validateBranchCode(tenantId, body.branch_code, body.exclude_branch_id);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
