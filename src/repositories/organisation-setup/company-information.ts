import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type CompanyInformation = {
  id: string;
  tenantId: string;
  companyName: string;
  legalName: string | null;
  businessType: string | null;
  businessSubcategory: string | null;
  taxNumber: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  website: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  pincode: string | null;
  address: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: Record<string, unknown>): CompanyInformation {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    companyName: row.company_name as string,
    legalName: (row.legal_name as string | null) ?? null,
    businessType: (row.business_type as string | null) ?? null,
    businessSubcategory: (row.business_subcategory as string | null) ?? null,
    taxNumber: (row.tax_number as string | null) ?? null,
    gstNumber: (row.gst_number as string | null) ?? null,
    panNumber: (row.pan_number as string | null) ?? null,
    companyEmail: (row.company_email as string | null) ?? null,
    companyPhone: (row.company_phone as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    pincode: (row.pincode as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getCompanyInformation(tenantId: string): Promise<CompanyInformation | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("company_information").select("*").eq("tenant_id", tenantId).maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function upsertCompanyInformation(
  tenantId: string,
  userId: string,
  input: Record<string, unknown>
) {
  const supabase = createAdminClient();
  const payload = {
    tenant_id: tenantId,
    company_name: String(input.company_name),
    legal_name: input.legal_name ? String(input.legal_name) : null,
    business_type: input.business_type ? String(input.business_type) : null,
    business_subcategory: input.business_subcategory ? String(input.business_subcategory) : null,
    tax_number: input.tax_number ? String(input.tax_number) : null,
    gst_number: input.gst_number ? String(input.gst_number) : null,
    pan_number: input.pan_number ? String(input.pan_number) : null,
    company_email: input.company_email ? String(input.company_email) : null,
    company_phone: input.company_phone ? String(input.company_phone) : null,
    website: input.website ? String(input.website) : null,
    country: input.country ? String(input.country) : null,
    state: input.state ? String(input.state) : null,
    city: input.city ? String(input.city) : null,
    pincode: input.pincode ? String(input.pincode) : null,
    address: input.address ? String(input.address) : null,
    logo_url: input.logo_url ? String(input.logo_url) : null,
    updated_by: userId,
  };

  const existing = await getCompanyInformation(tenantId);
  if (existing) {
    const { data, error } = await supabase
      .from("company_information")
      .update(payload)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from("company_information")
    .insert({ ...payload, created_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
