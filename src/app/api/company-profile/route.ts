import { apiError, apiSuccess } from "@/lib/api/response";
import { companyProfileService } from "@/lib/organisation-setup/company-profile-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { companyProfileDraftSchema, companyProfileSchema } from "@/validators/company-profile";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.settings.read, { req });
    const data = await companyProfileService.getForTenant(tenantId);
    return apiSuccess(data, undefined, 200, "Company profile loaded");
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId, userId, role } = await getTenantApiContext(P.tenant.settings.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only admins can create company profile", 403, "FORBIDDEN");
    }
    const body = companyProfileSchema.parse(await req.json());
    const data = await companyProfileService.save(tenantId, userId, body);
    return apiSuccess(data, undefined, 201, "Company profile created successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten().fieldErrors);
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PUT(req: Request) {
  try {
    const { tenantId, userId, role } = await getTenantApiContext(P.tenant.settings.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only admins can update company profile", 403, "FORBIDDEN");
    }
    const { searchParams } = new URL(req.url);
    const isDraft = searchParams.get("draft") === "true";
    const body = await req.json();
    const parsed = isDraft ? companyProfileDraftSchema.parse(body) : companyProfileSchema.parse(body);
    const data = await companyProfileService.save(tenantId, userId, parsed, { draft: isDraft });
    return apiSuccess(
      data,
      undefined,
      200,
      isDraft ? "Company profile draft saved" : "Company profile updated successfully"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten().fieldErrors);
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
