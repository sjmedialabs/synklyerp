import { createAdminClient } from "@/lib/supabase/admin";
import { resolveBusinessConfig } from "@/business-configs";
import { listActiveModules } from "@/repositories/tenant/modules";
import { listTenantEnabledModules } from "@/repositories/provisioning/tenant-enabled-modules";
import { resolveOnboardingProvisioning } from "@/lib/modules/activation";
import type { ErpModuleKey } from "@/constants/onboarding";

export type TenantModuleOption = {
  moduleCode: string;
  label: string;
  submodules: { code: string; label: string }[];
};

function businessTypeToSlug(businessType: string) {
  const map: Record<string, string> = { Product: "product", Service: "service", Hybrid: "hybrid" };
  return map[businessType] ?? "hybrid";
}

export async function getTenantAvailableModules(tenantId: string): Promise<TenantModuleOption[]> {
  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("business_type, industry_subtype")
    .eq("id", tenantId)
    .maybeSingle();

  const businessType = (tenant as { business_type?: string } | null)?.business_type ?? "Hybrid";
  const industrySubtype = (tenant as { industry_subtype?: string | null } | null)?.industry_subtype;

  let enabledModules = await listActiveModules(tenantId);
  if (!enabledModules.length) {
    enabledModules = resolveOnboardingProvisioning(businessType, industrySubtype).modules;
  }

  const tenantRows = await listTenantEnabledModules(tenantId);
  const allowedSubmodules = tenantRows.length
    ? tenantRows.filter((r) => r.submoduleCode).map((r) => r.submoduleCode as string)
    : resolveOnboardingProvisioning(businessType, industrySubtype).submodules;

  const config = resolveBusinessConfig(businessTypeToSlug(businessType), null, industrySubtype);
  const enabledSet = new Set(enabledModules);

  return config.erpModules
    .filter((moduleCode) => enabledSet.has(moduleCode))
    .map((moduleCode) => ({
      moduleCode,
      label: moduleLabel(moduleCode),
      submodules: config.submodules
        .filter((sub) => sub.erpModule === moduleCode && allowedSubmodules.includes(sub.code))
        .map((sub) => ({ code: sub.code, label: sub.label })),
    }));
}

export function buildSubmoduleParentMap(modules: TenantModuleOption[]) {
  const map: Record<string, string> = {};
  for (const mod of modules) {
    for (const sub of mod.submodules) {
      map[sub.code] = mod.moduleCode;
    }
  }
  return map;
}

export function filterModulesToTenant(
  tenantModules: string[],
  enabledModules: string[],
  enabledSubmodules: string[]
) {
  const allowed = new Set(tenantModules);
  return {
    modules: enabledModules.filter((m) => allowed.has(m)),
    submodules: enabledSubmodules,
  };
}

export function moduleLabel(code: ErpModuleKey | string) {
  const labels: Record<string, string> = {
    HR: "Human Resources",
    Finance: "Finance",
    Sales: "Sales & CRM",
    Projects: "Projects",
    Operations: "Operations",
    Marketing: "Marketing",
  };
  return labels[code] ?? code;
}
