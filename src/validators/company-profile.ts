import { z } from "zod";

export const COMPANY_TYPES = ["private_limited", "llp", "partnership", "sole_proprietor"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-100", "101-500", "500+"] as const;

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const optionalString = z.string().optional().or(z.literal(""));
const optionalUrl = z.string().url().optional().or(z.literal(""));

function normalizeUpper(value: string) {
  return value.trim().toUpperCase();
}

const companyProfileBaseSchema = z.object({
  legal_company_name: z.string().min(2).max(255),
  trade_name: z.string().max(255).optional().or(z.literal("")),
  company_type: z.enum(COMPANY_TYPES),
  industry_type: z.string().min(2).max(255),
  subcategory: z.string().min(2).max(255),
  incorporation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  gst_number: z
    .string()
    .transform(normalizeUpper)
    .refine((v) => !v || GSTIN_REGEX.test(v), "Invalid GSTIN format")
    .optional()
    .or(z.literal("")),
  pan_number: z
    .string()
    .transform(normalizeUpper)
    .refine((v) => !v || PAN_REGEX.test(v), "Invalid PAN format")
    .optional()
    .or(z.literal("")),
  cin_number: optionalString,
  tan_number: optionalString,
  msme_number: optionalString,
  address_line_1: z.string().min(2).optional().or(z.literal("")),
  address_line_2: optionalString,
  country: z.string().min(2).max(100).optional().or(z.literal("")),
  state: z.string().min(2).max(100).optional().or(z.literal("")),
  city: z.string().min(2).max(100).optional().or(z.literal("")),
  pincode: z.string().regex(/^\d{4,10}$/, "PIN code must be 4-10 digits").optional().or(z.literal("")),
  official_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  alternate_phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  website_url: optionalUrl,
  business_description: z.string().min(10).max(5000).optional().or(z.literal("")),
  employee_range: z.enum(EMPLOYEE_RANGES).optional(),
  annual_turnover: z
    .union([z.number().nonnegative(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : undefined;
    }),
  logo_url: optionalUrl,
  primary_color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .optional()
    .or(z.literal("")),
  secondary_color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .optional()
    .or(z.literal("")),
  tagline: z.string().max(255).optional().or(z.literal("")),
  bank_account_name: z.string().min(2).max(255).optional().or(z.literal("")),
  bank_name: z.string().min(2).max(255).optional().or(z.literal("")),
  account_number: z.string().regex(/^[0-9]{6,18}$/, "Invalid account number").optional().or(z.literal("")),
  ifsc_code: z
    .string()
    .transform(normalizeUpper)
    .refine((v) => !v || IFSC_REGEX.test(v), "Invalid IFSC code")
    .optional()
    .or(z.literal("")),
  bank_branch_name: z.string().min(2).max(255).optional().or(z.literal("")),
});

export const companyProfileDraftSchema = companyProfileBaseSchema.partial();

export const companyProfileSchema = companyProfileBaseSchema
  .extend({
    gst_number: z
      .string()
      .transform(normalizeUpper)
      .refine((v) => GSTIN_REGEX.test(v), "Invalid GSTIN format"),
    pan_number: z
      .string()
      .transform(normalizeUpper)
      .refine((v) => PAN_REGEX.test(v), "Invalid PAN format"),
    address_line_1: z.string().min(2),
    country: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    city: z.string().min(2).max(100),
    pincode: z.string().regex(/^\d{4,10}$/, "PIN code must be 4-10 digits"),
    official_email: z.string().email(),
    contact_phone: z.string().regex(/^\+?[0-9]{7,15}$/, "Invalid phone number"),
    business_description: z.string().min(10).max(5000),
    employee_range: z.enum(EMPLOYEE_RANGES),
    bank_account_name: z.string().min(2).max(255),
    bank_name: z.string().min(2).max(255),
    account_number: z.string().regex(/^[0-9]{6,18}$/, "Invalid account number"),
    ifsc_code: z
      .string()
      .transform(normalizeUpper)
      .refine((v) => IFSC_REGEX.test(v), "Invalid IFSC code"),
    bank_branch_name: z.string().min(2).max(255),
  })
  .superRefine((data, ctx) => {
    if (data.company_type === "private_limited" && !data.cin_number?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CIN is required for Private Limited companies",
        path: ["cin_number"],
      });
    }
  });

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
export type CompanyProfileDraftInput = z.infer<typeof companyProfileDraftSchema>;

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  private_limited: "Private Limited",
  llp: "LLP",
  partnership: "Partnership",
  sole_proprietor: "Sole Proprietor",
};
