import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { businessProvisioningService } from "@/lib/provisioning/business-provisioning-service";
import { resolveOnboardingProvisioning } from "@/lib/modules/activation";
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
  businessSubcategory: string | null;
  industrySubtype: string | null;
  employeeCount: string | null;
  businessSize: string | null;
  enabledModules: string[];
  enabledSubmodules: string[];
  previewModules: string[];
  previewSubmodules: string[];
  onboardingCompleted: boolean;
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

function parseEnabledSubmodules(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

export async function getOnboardingState(tenantId: string): Promise<OnboardingState> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "business_type, industry_subtype, employee_count, business_size, onboarding_draft, onboarding_completed_at, onboarding_locked, enabled_submodules"
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
      const industrySubtype = (legacy as { industry_subtype: string | null }).industry_subtype;
      const provisioning = resolveOnboardingProvisioning(businessType as BusinessType, industrySubtype);
      return {
        completed: true,
        locked: true,
        completedAt: null,
        draft: null,
        businessType,
        businessSubcategory: industrySubtype,
        industrySubtype,
        employeeCount: null,
        businessSize: null,
        enabledModules: provisioning.modules,
        enabledSubmodules: provisioning.submodules,
        previewModules: provisioning.modules,
        previewSubmodules: provisioning.submodules,
        onboardingCompleted: true,
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
    enabled_submodules: unknown;
  };

  const draft = parseDraft(row.onboarding_draft);
  const businessType = draft?.businessType ?? row.business_type;
  const industrySubtype = draft?.industrySubtype ?? row.industry_subtype;
  const provisioning = resolveOnboardingProvisioning(businessType, industrySubtype);
  const enabledModules = row.onboarding_completed_at
    ? await listActiveModules(tenantId)
    : provisioning.modules;
  const enabledSubmodules = row.onboarding_completed_at
    ? (() => {
        const stored = parseEnabledSubmodules(row.enabled_submodules);
        return stored.length > 0 ? stored : provisioning.submodules;
      })()
    : provisioning.submodules;

  return {
    completed: !!row.onboarding_completed_at,
    locked: row.onboarding_locked,
    completedAt: row.onboarding_completed_at,
    draft,
    businessType: row.business_type,
    businessSubcategory: row.industry_subtype,
    industrySubtype: row.industry_subtype,
    employeeCount: row.employee_count,
    businessSize: row.business_size,
    enabledModules,
    enabledSubmodules,
    previewModules: provisioning.modules,
    previewSubmodules: provisioning.submodules,
    onboardingCompleted: !!row.onboarding_completed_at,
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

  const provisioning = resolveOnboardingProvisioning(draft.businessType, draft.industrySubtype);

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

  return {
    draft,
    previewModules: provisioning.modules,
    previewSubmodules: provisioning.submodules,
  };
}

export async function confirmOnboarding(tenantId: string, userId: string) {
  const state = await getOnboardingState(tenantId);
  if (state.locked) throw new Error("ONBOARDING_LOCKED");

  const draft =
    state.draft ??
    ({
      businessType: state.businessType as OnboardingDraftInput["businessType"],
      industrySubtype: state.industrySubtype ?? INDUSTRY_FALLBACK,
      employeeCount: (state.employeeCount ?? "11-50") as OnboardingDraftInput["employeeCount"],
      businessSize: (state.businessSize ?? "SMB") as OnboardingDraftInput["businessSize"],
    } satisfies OnboardingDraftInput);

  try {
    const result = await businessProvisioningService.provisionTenantFromLegacyDraft(tenantId, userId, draft);
    return {
      completedAt: result.completedAt,
      enabledModules: result.enabledModules,
      enabledSubmodules: result.enabledSubmodules,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_BUSINESS_CONFIG") {
      return confirmOnboardingLegacy(tenantId, userId, draft);
    }
    throw error;
  }
}

async function confirmOnboardingLegacy(tenantId: string, userId: string, draft: OnboardingDraftInput) {
  const supabase = createAdminClient();
  const provisioning = resolveOnboardingProvisioning(draft.businessType, draft.industrySubtype);
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
      enabled_submodules: provisioning.submodules,
      updated_at: now,
    })
    .eq("id", tenantId);

  if (error) throw error;

  await activateModules(tenantId, provisioning.modules);
  await syncRolePermissionsForTenant(tenantId, provisioning.modules);

  await supabase.from("activity_logs").insert({
    tenant_id: tenantId,
    user_id: userId,
    module: "onboarding",
    action: "confirm",
    entity_type: "tenant",
    entity_id: tenantId,
    payload: {
      businessType: draft.businessType,
      businessSubcategory: draft.industrySubtype,
      modules: provisioning.modules,
      submodules: provisioning.submodules,
    },
  });

  return {
    completedAt: now,
    enabledModules: provisioning.modules,
    enabledSubmodules: provisioning.submodules,
  };
}

const INDUSTRY_FALLBACK = "Manufacturing";
