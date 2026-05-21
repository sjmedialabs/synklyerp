import { createAdminClient } from "@/lib/supabase/admin";
import { calculateProfileProgress } from "@/lib/organisation-setup/company-profile/completion";
import {
  formToDbPayload,
  mapProfileRow,
  profileToForm,
  recordToApiResponse,
  type CompanyProfileRecord,
} from "@/lib/organisation-setup/company-profile/mappers";
import { getCompanyInformation } from "@/repositories/organisation-setup/company-information";
import {
  assertUniqueTaxIdentifiers,
  getCompanyProfile,
  insertCompanyProfile,
  updateCompanyProfile,
} from "@/repositories/organisation-setup/company-profile";
import { writeCompanyProfileAuditLog } from "@/repositories/organisation-setup/company-profile-audit";
import {
  companyProfileDraftSchema,
  companyProfileSchema,
  type CompanyProfileDraftInput,
} from "@/validators/company-profile";
import { EMPLOYEE_COUNT_RANGES } from "@/constants/onboarding";

const LOGO_BUCKET = "tenant-assets";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

function mapEmployeeRange(range: string | null | undefined): CompanyProfileDraftInput["employee_range"] | undefined {
  if (!range) return undefined;
  if (range === "51-200") return "51-100";
  if (range === "201-500") return "101-500";
  if ((["1-10", "11-50", "51-100", "101-500", "500+"] as string[]).includes(range)) {
    return range as CompanyProfileDraftInput["employee_range"];
  }
  return EMPLOYEE_COUNT_RANGES.includes(range as (typeof EMPLOYEE_COUNT_RANGES)[number])
    ? (range as CompanyProfileDraftInput["employee_range"])
    : undefined;
}

export class CompanyProfileService {
  async getForTenant(tenantId: string) {
    let profile = await getCompanyProfile(tenantId);
    if (!profile) {
      profile = await this.buildDefaultProfile(tenantId);
    }

    const form = profileToForm(profile);
    const progress = calculateProfileProgress(form);
    return recordToApiResponse(profile, progress);
  }

  private async buildDefaultProfile(tenantId: string): Promise<CompanyProfileRecord> {
    const supabase = createAdminClient();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, business_type, industry_subtype, contact_email, employee_count")
      .eq("id", tenantId)
      .maybeSingle();

    const legacy = await getCompanyInformation(tenantId);

    const empty: CompanyProfileRecord = {
      id: "",
      tenantId,
      legalCompanyName: legacy?.companyName ?? (tenant as { name?: string } | null)?.name ?? null,
      tradeName: legacy?.legalName ?? null,
      companyType: null,
      industryType: legacy?.businessType ?? (tenant as { business_type?: string } | null)?.business_type ?? null,
      subcategory:
        legacy?.businessSubcategory ?? (tenant as { industry_subtype?: string | null } | null)?.industry_subtype ?? null,
      incorporationDate: null,
      gstNumber: legacy?.gstNumber ?? null,
      panNumber: legacy?.panNumber ?? null,
      cinNumber: null,
      tanNumber: legacy?.taxNumber ?? null,
      msmeNumber: null,
      addressLine1: legacy?.address ?? null,
      addressLine2: null,
      country: legacy?.country ?? "India",
      state: legacy?.state ?? null,
      city: legacy?.city ?? null,
      pincode: legacy?.pincode ?? null,
      officialEmail: legacy?.companyEmail ?? (tenant as { contact_email?: string | null } | null)?.contact_email ?? null,
      contactPhone: legacy?.companyPhone ?? null,
      alternatePhone: null,
      websiteUrl: legacy?.website ?? null,
      businessDescription: null,
      employeeRange: mapEmployeeRange((tenant as { employee_count?: string | null } | null)?.employee_count) ?? null,
      annualTurnover: null,
      logoUrl: legacy?.logoUrl ?? null,
      primaryColor: null,
      secondaryColor: null,
      tagline: null,
      bankAccountName: null,
      bankName: null,
      accountNumber: null,
      ifscCode: null,
      bankBranchName: null,
      profileCompletionPercentage: 0,
      isCompleted: false,
      createdAt: "",
      updatedAt: "",
    };

    return empty;
  }

  async save(tenantId: string, userId: string, input: CompanyProfileDraftInput, options?: { draft?: boolean }) {
    const parsed = options?.draft
      ? companyProfileDraftSchema.parse(input)
      : companyProfileSchema.parse(input);

    const existing = await getCompanyProfile(tenantId);
    await assertUniqueTaxIdentifiers(
      tenantId,
      parsed.gst_number,
      parsed.pan_number,
      existing?.id || undefined
    );

    const progress = calculateProfileProgress(parsed);
    const payload = formToDbPayload(parsed, userId, progress);
    const oldForm = existing ? profileToForm(existing) : null;

    let saved: CompanyProfileRecord;
    if (existing?.id) {
      saved = await updateCompanyProfile(tenantId, payload);
      await writeCompanyProfileAuditLog({
        tenantId,
        companyProfileId: saved.id,
        action: options?.draft ? "profile_draft_saved" : "profile_updated",
        oldData: oldForm as Record<string, unknown>,
        newData: parsed as Record<string, unknown>,
        performedBy: userId,
      });
    } else {
      saved = await insertCompanyProfile(tenantId, userId, payload);
      await writeCompanyProfileAuditLog({
        tenantId,
        companyProfileId: saved.id,
        action: "profile_created",
        newData: parsed as Record<string, unknown>,
        performedBy: userId,
      });
    }

    const form = profileToForm(saved);
    const updatedProgress = calculateProfileProgress(form);
    return recordToApiResponse(saved, updatedProgress);
  }

  async uploadLogo(tenantId: string, userId: string, file: File) {
    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      throw new Error("INVALID_LOGO_TYPE");
    }
    if (file.size > MAX_LOGO_BYTES) {
      throw new Error("LOGO_TOO_LARGE");
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${tenantId}/company-logo.${ext}`;
    const supabase = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(path, buffer, {
      upsert: true,
      contentType: file.type,
    });

    let logoUrl: string;
    if (uploadError) {
      const base64 = buffer.toString("base64");
      logoUrl = `data:${file.type};base64,${base64}`;
    } else {
      const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
      logoUrl = data.publicUrl;
    }

    const existing = await getCompanyProfile(tenantId);
    const currentForm = existing ? profileToForm(existing) : await profileToForm(await this.buildDefaultProfile(tenantId));
    const nextForm = { ...currentForm, logo_url: logoUrl };
    return this.save(tenantId, userId, nextForm, { draft: true });
  }
}

export const companyProfileService = new CompanyProfileService();
