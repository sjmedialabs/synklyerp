import { apiError, apiSuccess, parsePagination } from "@/lib/api/response";
import { branchSetupService } from "@/lib/organisation-setup/branch-setup-service";
import { getTenantAvailableModules } from "@/lib/organisation-setup/module-availability";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { createBranchSchema } from "@/validators/organisation-setup";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.branches.read, { req });
    const { searchParams } = new URL(req.url);
    const pagination = parsePagination(searchParams);

    const result = await branchSetupService.listBranches(tenantId, {
      page: pagination.page,
      limit: pagination.limit,
      search: pagination.search,
      status: searchParams.get("status") ?? undefined,
      designation: searchParams.get("designation") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: pagination.sortOrder,
    });

    const supabase = createAdminClient();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, business_type, industry_subtype, status")
      .eq("id", tenantId)
      .maybeSingle();

    return apiSuccess({
      ...result,
      tenant: tenant
        ? {
            name: (tenant as { name: string }).name,
            status: (tenant as { status: string }).status,
            businessType: (tenant as { business_type: string }).business_type,
            businessSubcategory: (tenant as { industry_subtype: string | null }).industry_subtype,
          }
        : null,
      availableModules: await getTenantAvailableModules(tenantId),
    });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId, userId, role } = await getTenantApiContext(P.organisation.branches.create, { req });
    if (role !== "ADMIN") {
      return apiError("Only admins can create branches", 403, "FORBIDDEN");
    }
    const body = createBranchSchema.parse(await req.json());
    const branch = await branchSetupService.createBranch(tenantId, userId, body);
    return apiSuccess(branch, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
