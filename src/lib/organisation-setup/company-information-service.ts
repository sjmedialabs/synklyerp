import { companyProfileService } from "@/lib/organisation-setup/company-profile-service";
import { getCompanyInformation, upsertCompanyInformation } from "@/repositories/organisation-setup/company-information";
import type { CompanyInformationInput } from "@/validators/organisation-setup";

/** @deprecated Use company_profiles via CompanyProfileService. Kept for backward compatibility. */
export class CompanyInformationService {
  async getForTenant(tenantId: string) {
    const profile = await companyProfileService.getForTenant(tenantId);
    return {
      id: profile.id,
      tenantId: profile.tenantId,
      companyName: profile.legalCompanyName,
      legalName: profile.tradeName,
      businessType: profile.industryType,
      businessSubcategory: profile.subcategory,
      taxNumber: profile.tanNumber,
      gstNumber: profile.gstNumber,
      panNumber: profile.panNumber,
      companyEmail: profile.officialEmail,
      companyPhone: profile.contactPhone,
      website: profile.websiteUrl,
      country: profile.country,
      state: profile.state,
      city: profile.city,
      pincode: profile.pincode,
      address: profile.addressLine1,
      logoUrl: profile.logoUrl,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async save(tenantId: string, userId: string, input: CompanyInformationInput) {
    const existing = await getCompanyInformation(tenantId);
    if (existing) {
      return upsertCompanyInformation(tenantId, userId, input);
    }
    await companyProfileService.save(
      tenantId,
      userId,
      {
        legal_company_name: input.company_name,
        trade_name: input.legal_name,
        industry_type: input.business_type ?? "",
        subcategory: input.business_subcategory ?? "",
        gst_number: input.gst_number,
        pan_number: input.pan_number,
        official_email: input.company_email,
        contact_phone: input.company_phone,
        website_url: input.website,
        country: input.country,
        state: input.state,
        city: input.city,
        pincode: input.pincode,
        address_line_1: input.address,
        logo_url: input.logo_url,
      },
      { draft: true }
    );
    return this.getForTenant(tenantId);
  }
}

export const companyInformationService = new CompanyInformationService();
