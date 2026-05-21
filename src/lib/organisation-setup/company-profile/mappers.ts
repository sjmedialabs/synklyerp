import type { CompanyProfileDraftInput } from "@/validators/company-profile";
import type { calculateProfileProgress } from "@/lib/organisation-setup/company-profile/completion";

export type CompanyProfileRecord = {
  id: string;
  tenantId: string;
  legalCompanyName: string | null;
  tradeName: string | null;
  companyType: string | null;
  industryType: string | null;
  subcategory: string | null;
  incorporationDate: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  cinNumber: string | null;
  tanNumber: string | null;
  msmeNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  pincode: string | null;
  officialEmail: string | null;
  contactPhone: string | null;
  alternatePhone: string | null;
  websiteUrl: string | null;
  businessDescription: string | null;
  employeeRange: string | null;
  annualTurnover: number | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  tagline: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  bankBranchName: string | null;
  profileCompletionPercentage: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export function mapProfileRow(row: Record<string, unknown>): CompanyProfileRecord {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    legalCompanyName: (row.legal_company_name as string | null) ?? null,
    tradeName: (row.trade_name as string | null) ?? null,
    companyType: (row.company_type as string | null) ?? null,
    industryType: (row.industry_type as string | null) ?? null,
    subcategory: (row.subcategory as string | null) ?? null,
    incorporationDate: row.incorporation_date
      ? String(row.incorporation_date).slice(0, 10)
      : null,
    gstNumber: (row.gst_number as string | null) ?? null,
    panNumber: (row.pan_number as string | null) ?? null,
    cinNumber: (row.cin_number as string | null) ?? null,
    tanNumber: (row.tan_number as string | null) ?? null,
    msmeNumber: (row.msme_number as string | null) ?? null,
    addressLine1: (row.address_line_1 as string | null) ?? null,
    addressLine2: (row.address_line_2 as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    pincode: (row.pincode as string | null) ?? null,
    officialEmail: (row.official_email as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    alternatePhone: (row.alternate_phone as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    businessDescription: (row.business_description as string | null) ?? null,
    employeeRange: (row.employee_range as string | null) ?? null,
    annualTurnover: row.annual_turnover != null ? Number(row.annual_turnover) : null,
    logoUrl: (row.logo_url as string | null) ?? null,
    primaryColor: (row.primary_color as string | null) ?? null,
    secondaryColor: (row.secondary_color as string | null) ?? null,
    tagline: (row.tagline as string | null) ?? null,
    bankAccountName: (row.bank_account_name as string | null) ?? null,
    bankName: (row.bank_name as string | null) ?? null,
    accountNumber: (row.account_number as string | null) ?? null,
    ifscCode: (row.ifsc_code as string | null) ?? null,
    bankBranchName: (row.bank_branch_name as string | null) ?? null,
    profileCompletionPercentage: Number(row.profile_completion_percentage ?? 0),
    isCompleted: Boolean(row.is_completed),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function profileToForm(record: CompanyProfileRecord): CompanyProfileDraftInput {
  return {
    legal_company_name: record.legalCompanyName ?? "",
    trade_name: record.tradeName ?? "",
    company_type: (record.companyType as CompanyProfileDraftInput["company_type"]) ?? undefined,
    industry_type: record.industryType ?? "",
    subcategory: record.subcategory ?? "",
    incorporation_date: record.incorporationDate ?? "",
    gst_number: record.gstNumber ?? "",
    pan_number: record.panNumber ?? "",
    cin_number: record.cinNumber ?? "",
    tan_number: record.tanNumber ?? "",
    msme_number: record.msmeNumber ?? "",
    address_line_1: record.addressLine1 ?? "",
    address_line_2: record.addressLine2 ?? "",
    country: record.country ?? "India",
    state: record.state ?? "",
    city: record.city ?? "",
    pincode: record.pincode ?? "",
    official_email: record.officialEmail ?? "",
    contact_phone: record.contactPhone ?? "",
    alternate_phone: record.alternatePhone ?? "",
    website_url: record.websiteUrl ?? "",
    business_description: record.businessDescription ?? "",
    employee_range: (record.employeeRange as CompanyProfileDraftInput["employee_range"]) ?? undefined,
    annual_turnover: record.annualTurnover ?? undefined,
    logo_url: record.logoUrl ?? "",
    primary_color: record.primaryColor ?? "",
    secondary_color: record.secondaryColor ?? "",
    tagline: record.tagline ?? "",
    bank_account_name: record.bankAccountName ?? "",
    bank_name: record.bankName ?? "",
    account_number: record.accountNumber ?? "",
    ifsc_code: record.ifscCode ?? "",
    bank_branch_name: record.bankBranchName ?? "",
  };
}

export function formToDbPayload(input: CompanyProfileDraftInput, userId: string, progress: { percentage: number; isCompleted: boolean }) {
  return {
    legal_company_name: input.legal_company_name || null,
    trade_name: input.trade_name || null,
    company_type: input.company_type || null,
    industry_type: input.industry_type || null,
    subcategory: input.subcategory || null,
    incorporation_date: input.incorporation_date || null,
    gst_number: input.gst_number ? String(input.gst_number).toUpperCase() : null,
    pan_number: input.pan_number ? String(input.pan_number).toUpperCase() : null,
    cin_number: input.cin_number || null,
    tan_number: input.tan_number || null,
    msme_number: input.msme_number || null,
    address_line_1: input.address_line_1 || null,
    address_line_2: input.address_line_2 || null,
    country: input.country || null,
    state: input.state || null,
    city: input.city || null,
    pincode: input.pincode || null,
    official_email: input.official_email || null,
    contact_phone: input.contact_phone || null,
    alternate_phone: input.alternate_phone || null,
    website_url: input.website_url || null,
    business_description: input.business_description || null,
    employee_range: input.employee_range || null,
    annual_turnover: input.annual_turnover ?? null,
    logo_url: input.logo_url || null,
    primary_color: input.primary_color || null,
    secondary_color: input.secondary_color || null,
    tagline: input.tagline || null,
    bank_account_name: input.bank_account_name || null,
    bank_name: input.bank_name || null,
    account_number: input.account_number || null,
    ifsc_code: input.ifsc_code ? String(input.ifsc_code).toUpperCase() : null,
    bank_branch_name: input.bank_branch_name || null,
    profile_completion_percentage: progress.percentage,
    is_completed: progress.isCompleted,
    updated_by: userId,
  };
}

export function recordToApiResponse(
  record: CompanyProfileRecord,
  progress: ReturnType<typeof calculateProfileProgress>
) {
  return {
    ...record,
    progress,
    sections: progress.completedCount,
  };
}
