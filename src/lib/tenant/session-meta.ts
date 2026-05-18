import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { listActiveModules } from "@/repositories/tenant/modules";
import { resolveModulesForBusinessType } from "@/lib/modules/activation";
import type { BusinessType } from "@/constants/onboarding";

export type TenantSessionMeta = {
  onboardingCompleted: boolean;
  enabledModules: string[];
};

export async function getTenantSessionMeta(tenantId: string | null): Promise<TenantSessionMeta> {
  if (!tenantId) {
    return { onboardingCompleted: true, enabledModules: [] };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("business_type, onboarding_completed_at")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn("[session-meta] onboarding columns missing — run migration 005_onboarding_tenant_modules.sql");
      return { onboardingCompleted: true, enabledModules: [] };
    }
    return { onboardingCompleted: false, enabledModules: [] };
  }
  if (!data) {
    return { onboardingCompleted: false, enabledModules: [] };
  }

  const row = data as { business_type: string; onboarding_completed_at: string | null };
  const completed = !!row.onboarding_completed_at;

  const enabledModules = completed
    ? await listActiveModules(tenantId)
    : resolveModulesForBusinessType(row.business_type as BusinessType);

  return { onboardingCompleted: completed, enabledModules };
}
