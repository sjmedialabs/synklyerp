import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type TenantBusinessProfile = {
  id: string;
  tenantId: string;
  businessTypeId: string;
  businessSubcategoryId: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  provisioningStatus: string;
  provisioningMetadata: Record<string, unknown>;
  confirmedBy: string | null;
};

export async function getTenantBusinessProfile(tenantId: string): Promise<TenantBusinessProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenant_business_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  if (!data) return null;
  return mapProfile(data as Record<string, unknown>);
}

export async function upsertTenantBusinessProfile(input: {
  tenantId: string;
  businessTypeId: string;
  businessSubcategoryId: string;
  provisioningStatus: string;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string | null;
  confirmedBy?: string | null;
  provisioningMetadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tenant_business_profiles")
    .upsert(
      {
        tenant_id: input.tenantId,
        business_type_id: input.businessTypeId,
        business_subcategory_id: input.businessSubcategoryId,
        provisioning_status: input.provisioningStatus,
        onboarding_completed: input.onboardingCompleted ?? false,
        onboarding_completed_at: input.onboardingCompletedAt ?? null,
        confirmed_by: input.confirmedBy ?? null,
        provisioning_metadata: input.provisioningMetadata ?? {},
        updated_at: now,
      },
      { onConflict: "tenant_id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapProfile(data as Record<string, unknown>);
}

export async function updateProvisioningStatus(
  tenantId: string,
  status: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createAdminClient();
  const patch: Record<string, unknown> = {
    provisioning_status: status,
    updated_at: new Date().toISOString(),
  };
  if (metadata) patch.provisioning_metadata = metadata;

  const { error } = await supabase.from("tenant_business_profiles").update(patch).eq("tenant_id", tenantId);
  if (error) throw error;
}

function mapProfile(row: Record<string, unknown>): TenantBusinessProfile {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    businessTypeId: row.business_type_id as string,
    businessSubcategoryId: row.business_subcategory_id as string,
    onboardingCompleted: row.onboarding_completed as boolean,
    onboardingCompletedAt: (row.onboarding_completed_at as string | null) ?? null,
    provisioningStatus: row.provisioning_status as string,
    provisioningMetadata: (row.provisioning_metadata as Record<string, unknown>) ?? {},
    confirmedBy: (row.confirmed_by as string | null) ?? null,
  };
}
