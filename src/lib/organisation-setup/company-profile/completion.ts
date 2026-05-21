import type { CompanyProfileDraftInput } from "@/validators/company-profile";
import { GSTIN_REGEX, IFSC_REGEX, PAN_REGEX } from "@/validators/company-profile";

export const PROFILE_SECTIONS = [
  { id: "basic", label: "Basic Company Details" },
  { id: "registration", label: "Registration & Tax" },
  { id: "address", label: "Registered Office" },
  { id: "contact", label: "Contact Details" },
  { id: "business", label: "Business Profile" },
  { id: "branding", label: "Branding" },
  { id: "banking", label: "Banking Details" },
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTIONS)[number]["id"];

function hasValue(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function isSectionComplete(section: ProfileSectionId, profile: CompanyProfileDraftInput): boolean {
  switch (section) {
    case "basic":
      return (
        hasValue(profile.legal_company_name) &&
        hasValue(profile.company_type) &&
        hasValue(profile.industry_type) &&
        hasValue(profile.subcategory) &&
        hasValue(profile.incorporation_date)
      );
    case "registration": {
      const cinOk =
        profile.company_type !== "private_limited" || hasValue(profile.cin_number);
      return (
        hasValue(profile.gst_number) &&
        GSTIN_REGEX.test(String(profile.gst_number).toUpperCase()) &&
        hasValue(profile.pan_number) &&
        PAN_REGEX.test(String(profile.pan_number).toUpperCase()) &&
        cinOk
      );
    }
    case "address":
      return (
        hasValue(profile.address_line_1) &&
        hasValue(profile.country) &&
        hasValue(profile.state) &&
        hasValue(profile.city) &&
        hasValue(profile.pincode) &&
        /^\d{4,10}$/.test(String(profile.pincode))
      );
    case "contact":
      return hasValue(profile.official_email) && hasValue(profile.contact_phone);
    case "business":
      return hasValue(profile.business_description) && hasValue(profile.employee_range);
    case "branding":
      return (
        hasValue(profile.logo_url) ||
        hasValue(profile.primary_color) ||
        hasValue(profile.secondary_color) ||
        hasValue(profile.tagline)
      );
    case "banking":
      return (
        hasValue(profile.bank_account_name) &&
        hasValue(profile.bank_name) &&
        hasValue(profile.account_number) &&
        hasValue(profile.ifsc_code) &&
        IFSC_REGEX.test(String(profile.ifsc_code).toUpperCase()) &&
        hasValue(profile.bank_branch_name)
      );
    default:
      return false;
  }
}

export function calculateProfileProgress(profile: CompanyProfileDraftInput) {
  const completedSections = PROFILE_SECTIONS.filter((s) => isSectionComplete(s.id, profile));
  const percentage = Math.round((completedSections.length / PROFILE_SECTIONS.length) * 100);
  return {
    completedSections: completedSections.map((s) => s.id),
    completedCount: completedSections.length,
    totalSections: PROFILE_SECTIONS.length,
    percentage,
    isCompleted: completedSections.length === PROFILE_SECTIONS.length,
  };
}
