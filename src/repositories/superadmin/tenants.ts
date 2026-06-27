import { createAdminClient } from "@/lib/supabase/admin";
import { businessProvisioningService } from "@/lib/provisioning/business-provisioning-service";
import {
  getBusinessTypeBySlug,
  getSubcategoryById,
} from "@/repositories/provisioning/business-types";
import { getTenantBusinessProfile } from "@/repositories/provisioning/tenant-business-profile";
import type { SuperAdminTenantPatchInput } from "@/validators/superadmin-tenants";

export async function updateSuperAdminTenant(
  tenantId: string,
  userId: string,
  input: SuperAdminTenantPatchInput
) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (input.name !== undefined) patch.name = input.name;
  if (input.status !== undefined) patch.status = input.status;

  if (Object.keys(patch).length > 1) {
    const { error } = await supabase.from("tenants").update(patch).eq("id", tenantId).is("deleted_at", null);
    if (error) throw error;
  }

  if (input.businessTypeSlug) {
    const type = await getBusinessTypeBySlug(input.businessTypeSlug);
    if (!type) throw new Error("INVALID_BUSINESS_TYPE");

    const subcategory =
      (input.businessSubcategorySlug
        ? type.subcategories.find((s) => s.slug === input.businessSubcategorySlug)
        : null) ?? type.subcategories[0];

    if (!subcategory) throw new Error("SUBCATEGORY_REQUIRED");

    const profile = await getTenantBusinessProfile(tenantId);
    const reason = input.reason?.trim() || "Super admin business type change";

    if (profile) {
      await businessProvisioningService.reprovisionTenant({
        tenantId,
        userId,
        businessTypeId: type.id,
        businessSubcategoryId: subcategory.id,
        reason,
      });
    } else {
      const { error } = await supabase
        .from("tenants")
        .update({
          business_type: type.legacyKey ?? type.name,
          industry_subtype: subcategory.legacyKey ?? subcategory.name,
          updated_at: now,
        })
        .eq("id", tenantId);
      if (error) throw error;
    }
  }

  const { data: tenant, error: fetchErr } = await supabase
    .from("tenants")
    .select("id, name, business_type, industry_subtype, plan, contact_email, status, created_at")
    .eq("id", tenantId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!tenant) throw new Error("NOT_FOUND");

  const profile = await getTenantBusinessProfile(tenantId);
  let businessTypeSlug: string | null = null;
  let businessSubcategorySlug: string | null = null;

  if (profile) {
    const match = await getSubcategoryById(profile.businessSubcategoryId);
    businessTypeSlug = match?.type.slug ?? null;
    businessSubcategorySlug = match?.subcategory.slug ?? null;
  }

  return {
    id: tenant.id as string,
    name: tenant.name as string,
    businessType: tenant.business_type as string,
    industrySubtype: (tenant.industry_subtype as string | null) ?? null,
    plan: tenant.plan as string,
    contactEmail: (tenant.contact_email as string | null) ?? null,
    status: tenant.status as string,
    createdAt: tenant.created_at as string,
    businessTypeSlug,
    businessSubcategorySlug,
  };
}
