import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { mapProfileRow, type CompanyProfileRecord } from "@/lib/organisation-setup/company-profile/mappers";

export async function getCompanyProfile(tenantId: string): Promise<CompanyProfileRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  return data ? mapProfileRow(data as Record<string, unknown>) : null;
}

export async function insertCompanyProfile(
  tenantId: string,
  userId: string,
  payload: Record<string, unknown>
): Promise<CompanyProfileRecord> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_profiles")
    .insert({ tenant_id: tenantId, created_by: userId, ...payload })
    .select("*")
    .single();
  if (error) throw error;
  return mapProfileRow(data as Record<string, unknown>);
}

export async function updateCompanyProfile(
  tenantId: string,
  payload: Record<string, unknown>
): Promise<CompanyProfileRecord> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_profiles")
    .update(payload)
    .eq("tenant_id", tenantId)
    .select("*")
    .single();
  if (error) throw error;
  return mapProfileRow(data as Record<string, unknown>);
}

export async function assertUniqueTaxIdentifiers(
  tenantId: string,
  gstNumber?: string | null,
  panNumber?: string | null,
  excludeProfileId?: string
) {
  const supabase = createAdminClient();

  if (gstNumber) {
    let query = supabase
      .from("company_profiles")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("gst_number", gstNumber.toUpperCase());
    if (excludeProfileId) query = query.neq("id", excludeProfileId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (data) throw new Error("DUPLICATE_GST_NUMBER");
  }

  if (panNumber) {
    let query = supabase
      .from("company_profiles")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("pan_number", panNumber.toUpperCase());
    if (excludeProfileId) query = query.neq("id", excludeProfileId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (data) throw new Error("DUPLICATE_PAN_NUMBER");
  }
}
