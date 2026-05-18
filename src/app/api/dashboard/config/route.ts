import { apiError, apiSuccess } from "@/lib/api/response";
import { resolveDashboard } from "@/lib/dashboard/resolve-widgets";
import { listUserPermissions } from "@/lib/rbac/permissions";
import { handleApiError, resolveTenantId, requireTenantSession } from "@/lib/tenant/context";
import { listActiveModules } from "@/repositories/tenant/modules";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);

    const permissions = await listUserPermissions(ctx.userId, ctx.role, tenantId);
    const enabledModules = await listActiveModules(tenantId);

    let businessType = "Hybrid";
    const supabase = createAdminClient();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("business_type, name")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenant) {
      businessType = (tenant as { business_type: string }).business_type;
    }

    const config = resolveDashboard({
      enabledModules,
      permissions,
      role: ctx.role,
      businessType,
      tenantName: (tenant as { name?: string } | null)?.name ?? null,
    });

    return apiSuccess(config);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}
