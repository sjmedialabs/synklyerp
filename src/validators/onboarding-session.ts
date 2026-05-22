import { z } from "zod";
import { BUSINESS_SIZES, EMPLOYEE_COUNT_RANGES } from "@/constants/onboarding";
import { GSTIN_REGEX, PAN_REGEX } from "@/validators/company-profile";

export const ONBOARDING_STEPS = [
  "business_type",
  "category",
  "subcategory",
  "organization",
  "review",
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number];

export const organizationSetupSchema = z.object({
  companyName: z.string().min(2).max(255),
  tradeName: z.string().max(255).optional().or(z.literal("")),
  gstin: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .refine((v) => !v || GSTIN_REGEX.test(v), "Invalid GSTIN format")
    .optional()
    .or(z.literal("")),
  pan: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .refine((v) => !v || PAN_REGEX.test(v), "Invalid PAN format")
    .optional()
    .or(z.literal("")),
  cin: z.string().max(30).optional().or(z.literal("")),
  businessEmail: z.string().email().optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  country: z.string().min(2).max(100).optional().or(z.literal("")),
  state: z.string().min(2).max(100).optional().or(z.literal("")),
  city: z.string().min(2).max(100).optional().or(z.literal("")),
  timezone: z.string().max(80).optional().or(z.literal("")),
  currency: z.string().length(3).optional().or(z.literal("")),
  financialYear: z.string().max(20).optional().or(z.literal("")),
  industryTags: z.array(z.string().max(50)).max(10).optional(),
  numberOfEmployees: z.enum(EMPLOYEE_COUNT_RANGES).optional(),
  branches: z.coerce.number().int().min(1).max(999).optional(),
  website: z.string().url().optional().or(z.literal("")),
  businessSize: z.enum(BUSINESS_SIZES).optional(),
});

export type OrganizationSetupInput = z.infer<typeof organizationSetupSchema>;

export const saveOnboardingStepSchema = z.object({
  step: z.number().int().min(0).max(4),
  businessTypeId: z.string().uuid().optional().nullable(),
  businessCategoryId: z.string().uuid().optional().nullable(),
  businessSpecializationId: z.string().uuid().optional().nullable(),
  organization: organizationSetupSchema.partial().optional(),
  employeeCount: z.enum(EMPLOYEE_COUNT_RANGES).optional(),
  businessSize: z.enum(BUSINESS_SIZES).optional(),
});

export type SaveOnboardingStepInput = z.infer<typeof saveOnboardingStepSchema>;

export const completeOnboardingSchema = z.object({
  businessTypeId: z.string().uuid(),
  businessCategoryId: z.string().uuid(),
  businessSpecializationId: z.string().uuid().optional().nullable(),
  organization: organizationSetupSchema,
  employeeCount: z.enum(EMPLOYEE_COUNT_RANGES),
  businessSize: z.enum(BUSINESS_SIZES),
  confirmation: z.literal(true),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
