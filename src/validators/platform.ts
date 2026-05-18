import { z } from "zod";
import { ERP_MODULE_KEYS } from "@/constants/onboarding";

export const planSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  planType: z.enum(["free", "starter", "professional", "enterprise", "custom"]),
  monthlyPriceCents: z.number().int().min(0),
  yearlyPriceCents: z.number().int().min(0),
  trialDays: z.number().int().min(0),
  currency: z.string().length(3),
  features: z.array(z.string()),
  modules: z.array(z.enum(ERP_MODULE_KEYS as unknown as [string, ...string[]])),
  userLimit: z.number().int().positive().nullable().optional(),
  storageLimitMb: z.number().int().positive().nullable().optional(),
  apiLimitMonthly: z.number().int().positive().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  sortOrder: z.number().int(),
});

export const cmsPageSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  status: z.enum(["draft", "published"]),
  contentHtml: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  schemaJson: z.record(z.string(), z.unknown()).optional(),
});
