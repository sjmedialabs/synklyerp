import { z } from "zod";

export const assignSidebarTemplateSchema = z.object({
  templateId: z.string().uuid(),
});

export const updateMenuVisibilitySchema = z.object({
  hiddenMenuSlugs: z.array(z.string()).default([]),
});

export const reorderMenusSchema = z.object({
  customOrder: z.record(z.string(), z.number()),
});

export const toggleFavoriteSchema = z.object({
  menuSlug: z.string().min(1),
  favorite: z.boolean(),
});

export const trackRecentSchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
});

export type AssignSidebarTemplateInput = z.infer<typeof assignSidebarTemplateSchema>;
