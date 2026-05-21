import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { listActiveModules } from "@/repositories/tenant/modules";
import { resolveModulesForOnboarding } from "@/lib/modules/activation";
import type { BusinessType } from "@/constants/onboarding";

export type TenantSessionMeta = {
  onboardingCompleted: boolean;
  enabledModules: string[];
};

function parseDraftSubtype(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const subtype = (raw as Record<string, unknown>).industrySubtype;
  return typeof subtype === "string" ? subtype : null;
}

export async function getTenantSessionMeta(tenantId: string | null): Promise<TenantSessionMeta> {
  if (!tenantId) {
    return { onboardingCompleted: true, enabledModules: [] };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("business_type, industry_subtype, onboarding_draft, onboarding_completed_at")
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

  const row = data as {
    business_type: string;
    industry_subtype: string | null;
    onboarding_draft: unknown;
    onboarding_completed_at: string | null;
  };
  const completed = !!row.onboarding_completed_at;
  const draftSubtype = parseDraftSubtype(row.onboarding_draft);
  const industrySubtype = draftSubtype ?? row.industry_subtype;

  const enabledModules = completed
    ? await listActiveModules(tenantId)
    : resolveModulesForOnboarding(row.business_type as BusinessType, industrySubtype);

  return { onboardingCompleted: completed, enabledModules };
}
