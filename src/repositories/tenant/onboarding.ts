import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { resolveModulesForBusinessType } from "@/lib/modules/activation";
import type { BusinessType } from "@/constants/onboarding";
import { activateModules, listActiveModules } from "@/repositories/tenant/modules";
import { syncRolePermissionsForTenant } from "@/lib/rbac/sync-tenant-roles";
import type { OnboardingDraftInput } from "@/validators/onboarding";

export type OnboardingState = {
  completed: boolean;
  locked: boolean;
  completedAt: string | null;
  draft: OnboardingDraftInput | null;
  businessType: string;
  industrySubtype: string | null;
  employeeCount: string | null;
  businessSize: string | null;
  enabledModules: string[];
  previewModules: string[];
};

function parseDraft(raw: unknown): OnboardingDraftInput | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (!d.businessType || !d.industrySubtype) return null;
  return {
    businessType: String(d.businessType) as OnboardingDraftInput["businessType"],
    industrySubtype: String(d.industrySubtype),
    employeeCount: String(d.employeeCount ?? "11-50") as OnboardingDraftInput["employeeCount"],
    businessSize: String(d.businessSize ?? "SMB") as OnboardingDraftInput["businessSize"],
  };
}

export async function getOnboardingState(tenantId: string): Promise<OnboardingState> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "business_type, industry_subtype, employee_count, business_size, onboarding_draft, onboarding_completed_at, onboarding_locked"
    )
    .eq("id", tenantId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) {
      const { data: legacy, error: legacyErr } = await supabase
        .from("tenants")
        .select("business_type, industry_subtype")
        .eq("id", tenantId)
        .maybeSingle();
      if (legacyErr || !legacy) throw legacyErr ?? new Error("NOT_FOUND");
      const businessType = (legacy as { business_type: string }).business_type;
      const previewModules = resolveModulesForBusinessType(businessType as BusinessType);
      return {
        completed: true,
        locked: true,
        completedAt: null,
        draft: null,
        businessType,
        industrySubtype: (legacy as { industry_subtype: string | null }).industry_subtype,
        employeeCount: null,
        businessSize: null,
        enabledModules: previewModules,
        previewModules,
      };
    }
    throw error;
  }
  if (!data) throw new Error("NOT_FOUND");

  const row = data as {
    business_type: string;
    industry_subtype: string | null;
    employee_count: string | null;
    business_size: string | null;
    onboarding_draft: unknown;
    onboarding_completed_at: string | null;
    onboarding_locked: boolean;
  };

  const draft = parseDraft(row.onboarding_draft);
  const businessType = draft?.businessType ?? row.business_type;
  const previewModules = resolveModulesForBusinessType(businessType);
  const enabledModules = row.onboarding_completed_at
    ? await listActiveModules(tenantId)
    : previewModules;

  return {
    completed: !!row.onboarding_completed_at,
    locked: row.onboarding_locked,
    completedAt: row.onboarding_completed_at,
    draft,
    businessType: row.business_type,
    industrySubtype: row.industry_subtype,
    employeeCount: row.employee_count,
    businessSize: row.business_size,
    enabledModules,
    previewModules,
  };
}

export async function saveOnboardingDraft(tenantId: string, draft: OnboardingDraftInput) {
  const supabase = createAdminClient();
  const { data: tenant, error: fetchErr } = await supabase
    .from("tenants")
    .select("onboarding_locked, onboarding_completed_at")
    .eq("id", tenantId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!tenant) throw new Error("NOT_FOUND");

  const t = tenant as { onboarding_locked: boolean; onboarding_completed_at: string | null };
  if (t.onboarding_locked || t.onboarding_completed_at) {
    throw new Error("ONBOARDING_LOCKED");
  }

  const previewModules = resolveModulesForBusinessType(draft.businessType);

  const { error } = await supabase
    .from("tenants")
    .update({
      business_type: draft.businessType,
      industry_subtype: draft.industrySubtype,
      employee_count: draft.employeeCount,
      business_size: draft.businessSize,
      onboarding_draft: draft,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);

  if (error) throw error;

  return { draft, previewModules };
}

export async function confirmOnboarding(tenantId: string, userId: string) {
  const supabase = createAdminClient();
  const state = await getOnboardingState(tenantId);

  if (state.locked) throw new Error("ONBOARDING_LOCKED");

  const draft =
    state.draft ??
    ({
      businessType: state.businessType as OnboardingDraftInput["businessType"],
      industrySubtype: state.industrySubtype ?? "Other",
      employeeCount: (state.employeeCount ?? "11-50") as OnboardingDraftInput["employeeCount"],
      businessSize: (state.businessSize ?? "SMB") as OnboardingDraftInput["businessSize"],
    } satisfies OnboardingDraftInput);

  const modules = resolveModulesForBusinessType(draft.businessType);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("tenants")
    .update({
      business_type: draft.businessType,
      industry_subtype: draft.industrySubtype,
      employee_count: draft.employeeCount,
      business_size: draft.businessSize,
      onboarding_draft: draft,
      onboarding_completed_at: now,
      onboarding_locked: true,
      updated_at: now,
    })
    .eq("id", tenantId);

  if (error) throw error;

  await activateModules(tenantId, modules);
  await syncRolePermissionsForTenant(tenantId);

  await supabase.from("activity_logs").insert({
    tenant_id: tenantId,
    user_id: userId,
    module: "onboarding",
    action: "confirm",
    entity_type: "tenant",
    entity_id: tenantId,
    payload: { businessType: draft.businessType, modules },
  });

  return { completedAt: now, enabledModules: modules };
}
