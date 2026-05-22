import { createAdminClient } from "@/lib/supabase/admin";
import { businessProvisioningService } from "@/lib/provisioning/business-provisioning-service";
import { writeActivityLog } from "@/repositories/enterprise/activity";
import { getSubcategoryById } from "@/repositories/provisioning/business-types";
import { getSpecializationById } from "@/repositories/provisioning/business-specializations";
import { deleteOnboardingSession } from "@/repositories/provisioning/onboarding-sessions";
import { insertCompanyProfile } from "@/repositories/organisation-setup/company-profile";
import type { CompleteOnboardingInput } from "@/validators/onboarding-session";
import type { OnboardingDraftInput } from "@/validators/onboarding";

export class OnboardingCompletionService {
  async complete(input: {
    tenantId: string;
    userId: string;
    payload: CompleteOnboardingInput;
  }) {
    const match = await getSubcategoryById(input.payload.businessCategoryId);
    if (!match || match.type.id !== input.payload.businessTypeId) {
      throw new Error("INVALID_BUSINESS_SELECTION");
    }

    if (input.payload.businessSpecializationId) {
      const spec = await getSpecializationById(input.payload.businessSpecializationId);
      if (!spec || spec.businessSubcategoryId !== input.payload.businessCategoryId) {
        throw new Error("INVALID_SPECIALIZATION");
      }
    }

    const legacyBusinessType = match.type.legacyKey ?? match.type.slug;
    const legacySubcategory = match.subcategory.legacyKey ?? match.subcategory.name;

    const draft: OnboardingDraftInput = {
      businessType: legacyBusinessType as OnboardingDraftInput["businessType"],
      industrySubtype: legacySubcategory,
      employeeCount: input.payload.employeeCount,
      businessSize: input.payload.businessSize,
    };

    const result = await businessProvisioningService.provisionTenant({
      tenantId: input.tenantId,
      userId: input.userId,
      businessTypeId: input.payload.businessTypeId,
      businessSubcategoryId: input.payload.businessCategoryId,
      draft,
    });

    await this.persistOrganizationProfile(input.tenantId, input.userId, input.payload, match);
    await this.updateTenantMetadata(input.tenantId, input.payload, legacyBusinessType, legacySubcategory);
    await this.linkSpecialization(input.tenantId, input.payload.businessSpecializationId);
    await deleteOnboardingSession(input.tenantId);

    await this.audit(input.tenantId, input.userId, "onboarding_complete", {
      businessTypeId: input.payload.businessTypeId,
      businessCategoryId: input.payload.businessCategoryId,
      businessSpecializationId: input.payload.businessSpecializationId,
      ...result,
    });

    return result;
  }

  private async persistOrganizationProfile(
    tenantId: string,
    userId: string,
    payload: CompleteOnboardingInput,
    match: NonNullable<Awaited<ReturnType<typeof getSubcategoryById>>>
  ) {
    const org = payload.organization;
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("company_profiles")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const profilePayload = {
      legal_company_name: org.companyName,
      trade_name: org.tradeName || null,
      industry_type: match.type.name,
      subcategory: match.subcategory.name,
      gst_number: org.gstin || null,
      pan_number: org.pan || null,
      cin_number: org.cin || null,
      official_email: org.businessEmail || null,
      contact_phone: org.phone || null,
      address_line_1: org.address || null,
      country: org.country || null,
      state: org.state || null,
      city: org.city || null,
      website_url: org.website || null,
      employee_range: payload.employeeCount,
      profile_completion_percentage: 60,
      is_completed: false,
      updated_by: userId,
    };

    if (existing) {
      await supabase.from("company_profiles").update(profilePayload).eq("tenant_id", tenantId);
    } else {
      await insertCompanyProfile(tenantId, userId, profilePayload);
    }

    await supabase
      .from("tenants")
      .update({
        name: org.companyName,
        contact_email: org.businessEmail || undefined,
        timezone: org.timezone || undefined,
        currency: org.currency || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    const { data: branch } = await supabase
      .from("branches")
      .select("id")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (!branch) {
      await supabase.from("branches").insert({
        tenant_id: tenantId,
        name: org.tradeName || org.companyName,
        code: "HQ",
        is_primary: true,
        is_corporate: true,
        city: org.city || null,
        state: org.state || null,
        country: org.country || null,
        address: org.address || null,
        status: "ACTIVE",
        created_by: userId,
      });
    }
  }

  private async updateTenantMetadata(
    tenantId: string,
    payload: CompleteOnboardingInput,
    legacyBusinessType: string,
    legacySubcategory: string
  ) {
    const supabase = createAdminClient();
    await supabase
      .from("tenants")
      .update({
        business_type: legacyBusinessType,
        industry_subtype: legacySubcategory,
        employee_count: payload.employeeCount,
        business_size: payload.businessSize,
        onboarding_step: 5,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);
  }

  private async linkSpecialization(tenantId: string, specializationId?: string | null) {
    if (!specializationId) return;
    const supabase = createAdminClient();
    await supabase
      .from("tenant_business_profiles")
      .update({ business_specialization_id: specializationId })
      .eq("tenant_id", tenantId);
  }

  private async audit(
    tenantId: string,
    userId: string,
    action: string,
    payload: Record<string, unknown>
  ) {
    try {
      await writeActivityLog({
        tenantId,
        userId,
        module: "onboarding",
        action,
        entityType: "tenant",
        entityId: tenantId,
        payload,
      });
    } catch {
      /* non-blocking */
    }
  }
}

export const onboardingCompletionService = new OnboardingCompletionService();
