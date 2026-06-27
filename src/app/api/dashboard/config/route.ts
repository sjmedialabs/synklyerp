import { apiError, apiSuccess } from "@/lib/api/response";
import { loadTenantDashboardConfig } from "@/lib/dashboard/load-tenant-dashboard";
import { getAssignedModuleKeysForTenant } from "@/lib/provisioning/category-feature-service";
import { listUserPermissions } from "@/lib/rbac/permissions";
import { handleApiError, resolveTenantId, requireTenantSession } from "@/lib/tenant/context";
import { listActiveModules } from "@/repositories/tenant/modules";
import { listTenantEnabledSubmoduleCodes } from "@/repositories/provisioning/tenant-enabled-modules";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);

    const permissions = await listUserPermissions(ctx.userId, ctx.role, tenantId);
    const enabledModules = await listActiveModules(tenantId);
    const assignedModuleKeys = await getAssignedModuleKeysForTenant(tenantId);

    const supabase = createAdminClient();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("business_type, industry_subtype, name")
      .eq("id", tenantId)
      .maybeSingle();

    let businessType = "Hybrid";
    let industrySubtype: string | null = null;
    if (tenant) {
      businessType = (tenant as { business_type: string }).business_type;
      industrySubtype = (tenant as { industry_subtype: string | null }).industry_subtype;
    }

    const config = await loadTenantDashboardConfig(
      {
        enabledModules,
        permissions,
        role: ctx.role,
        businessType,
        industrySubtype,
        tenantName: (tenant as { name?: string } | null)?.name ?? null,
        assignedModuleKeys,
      },
      tenantId
    );

    const enabledSubmodules = await listTenantEnabledSubmoduleCodes(tenantId);

    return apiSuccess({ ...config, enabledSubmodules });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
