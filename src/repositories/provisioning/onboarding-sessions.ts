import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { OrganizationSetupInput, SaveOnboardingStepInput } from "@/validators/onboarding-session";

export type OnboardingSessionRecord = {
  id: string;
  tenantId: string;
  currentStep: number;
  businessTypeId: string | null;
  businessCategoryId: string | null;
  businessSpecializationId: string | null;
  organizationData: OrganizationSetupInput;
  employeeCount: string | null;
  businessSize: string | null;
  metadata: Record<string, unknown>;
  lastSavedAt: string | null;
};

function mapRow(row: Record<string, unknown>): OnboardingSessionRecord {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    currentStep: Number(row.current_step ?? 0),
    businessTypeId: (row.business_type_id as string | null) ?? null,
    businessCategoryId: (row.business_category_id as string | null) ?? null,
    businessSpecializationId: (row.business_specialization_id as string | null) ?? null,
    organizationData: (row.organization_data as OrganizationSetupInput) ?? {},
    employeeCount: (row.employee_count as string | null) ?? null,
    businessSize: (row.business_size as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    lastSavedAt: (row.last_saved_at as string | null) ?? null,
  };
}

export async function getOnboardingSession(tenantId: string): Promise<OnboardingSessionRecord | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("onboarding_sessions")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) {
      if (isMissingSchemaError(error)) return null;
      throw error;
    }
    return data ? mapRow(data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function upsertOnboardingSession(
  tenantId: string,
  input: SaveOnboardingStepInput
): Promise<OnboardingSessionRecord> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const existing = await getOnboardingSession(tenantId);

  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    current_step: input.step,
    last_saved_at: now,
    updated_at: now,
  };

  if (input.businessTypeId !== undefined) payload.business_type_id = input.businessTypeId;
  if (input.businessCategoryId !== undefined) payload.business_category_id = input.businessCategoryId;
  if (input.businessSpecializationId !== undefined) {
    payload.business_specialization_id = input.businessSpecializationId;
  }
  if (input.organization) {
    payload.organization_data = {
      ...(existing?.organizationData ?? {}),
      ...input.organization,
    };
  }
  if (input.employeeCount) payload.employee_count = input.employeeCount;
  if (input.businessSize) payload.business_size = input.businessSize;

  if (existing) {
    const { data, error } = await supabase
      .from("onboarding_sessions")
      .update(payload)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from("onboarding_sessions")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function deleteOnboardingSession(tenantId: string) {
  const supabase = createAdminClient();
  await supabase.from("onboarding_sessions").delete().eq("tenant_id", tenantId);
}
