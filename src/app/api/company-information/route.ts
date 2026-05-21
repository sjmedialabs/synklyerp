import { apiError, apiSuccess } from "@/lib/api/response";
import { companyInformationService } from "@/lib/organisation-setup/company-information-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { companyInformationSchema } from "@/validators/organisation-setup";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.settings.read, { req });
    const data = await companyInformationService.getForTenant(tenantId);
    return apiSuccess(data);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId, userId, role } = await getTenantApiContext(P.tenant.settings.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only admins can update company information", 403, "FORBIDDEN");
    }
    const body = companyInformationSchema.parse(await req.json());
    const data = await companyInformationService.save(tenantId, userId, body);
    return apiSuccess(data, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
