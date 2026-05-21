import { apiError, apiSuccess } from "@/lib/api/response";
import { companyProfileService } from "@/lib/organisation-setup/company-profile-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";

export async function POST(req: Request) {
  try {
    const { tenantId, userId, role } = await getTenantApiContext(P.tenant.settings.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only admins can upload company logo", 403, "FORBIDDEN");
    }

    const formData = await req.formData();
    const file = formData.get("logo");
    if (!(file instanceof File)) {
      return apiError("Logo file is required", 400, "VALIDATION_ERROR");
    }

    const data = await companyProfileService.uploadLogo(tenantId, userId, file);
    return apiSuccess(data, undefined, 200, "Logo uploaded successfully");
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
