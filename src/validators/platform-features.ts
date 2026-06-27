import { z } from "zod";

const slugRegex = /^[a-z0-9-]+$/;

export const erpFeatureSchema = z.object({
  id: z.string().uuid().optional(),
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).regex(slugRegex),
  path: z.string().max(255).nullable().optional(),
  icon: z.string().max(80).nullable().optional(),
  moduleKey: z.string().max(80).nullable().optional(),
  menuType: z.enum(["section", "group", "item"]).default("item"),
  permissionModule: z.string().max(80).nullable().optional(),
  permissionFeature: z.string().max(80).nullable().optional(),
  permissionAction: z.string().max(20).default("read"),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  isAlwaysVisible: z.boolean().default(false),
  level: z.number().int().min(0).max(20).optional(),
  requiredPlan: z.string().max(40).nullable().optional(),
  requiredBusinessTypes: z.array(z.string()).default([]),
  hiddenForBusinessTypes: z.array(z.string()).default([]),
  requiredSubmodules: z.array(z.string()).default([]),
  featureFlagKey: z.string().max(80).nullable().optional(),
  badge: z.string().max(40).nullable().optional(),
  status: z.string().max(20).default("built"),
});

export const reorderFeaturesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      parentId: z.string().uuid().nullable(),
      sortOrder: z.number().int().min(0),
      level: z.number().int().min(0).max(20).optional(),
    })
  ),
});

export type ErpFeatureInput = z.infer<typeof erpFeatureSchema>;
