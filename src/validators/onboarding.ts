import { z } from "zod";
import { BUSINESS_SIZES, BUSINESS_TYPES, EMPLOYEE_COUNT_RANGES } from "@/constants/onboarding";

export const onboardingDraftSchema = z.object({
  businessType: z.enum(BUSINESS_TYPES),
  industrySubtype: z.string().min(1).max(100),
  employeeCount: z.enum(EMPLOYEE_COUNT_RANGES),
  businessSize: z.enum(BUSINESS_SIZES),
});

export type OnboardingDraftInput = z.infer<typeof onboardingDraftSchema>;
