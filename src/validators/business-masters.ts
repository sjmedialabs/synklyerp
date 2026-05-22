import { z } from "zod";

export const businessTypeMasterSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional().nullable(),
  legacyKey: z.string().max(40).optional().nullable(),
  icon: z.string().max(80).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  themeColor: z.string().max(20).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const businessCategoryMasterSchema = z.object({
  id: z.string().uuid().optional(),
  businessTypeId: z.string().uuid(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional().nullable(),
  legacyKey: z.string().max(120).optional().nullable(),
  icon: z.string().max(80).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  enabledModules: z.array(z.string()).default([]),
  workflows: z.array(z.record(z.string(), z.unknown())).default([]),
  sidebarPreset: z.record(z.string(), z.unknown()).default({}),
  isActive: z.boolean().default(true),
});

export const businessSpecializationMasterSchema = z.object({
  id: z.string().uuid().optional(),
  businessSubcategoryId: z.string().uuid(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(80).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  onboardingFormSchema: z.array(z.record(z.string(), z.unknown())).default([]),
  workflowRules: z.array(z.record(z.string(), z.unknown())).default([]),
  defaultModules: z.array(z.string()).default([]),
  enabledReports: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const dashboardTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional().nullable(),
  layout: z.record(z.string(), z.unknown()).default({ columns: 4, rows: [] }),
  widgets: z.array(z.string()).default([]),
  kpis: z.array(z.string()).default([]),
  charts: z.array(z.string()).default([]),
  quickActions: z.array(z.string()).default([]),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type BusinessTypeMasterInput = z.infer<typeof businessTypeMasterSchema>;
export type BusinessCategoryMasterInput = z.infer<typeof businessCategoryMasterSchema>;
export type BusinessSpecializationMasterInput = z.infer<typeof businessSpecializationMasterSchema>;
export type DashboardTemplateInput = z.infer<typeof dashboardTemplateSchema>;
