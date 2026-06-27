import { z } from "zod";

export const categoryFeatureAssignmentItemSchema = z.object({
  menuId: z.string().uuid(),
  isEnabled: z.boolean(),
});

export const replaceCategoryFeaturesSchema = z.object({
  assignments: z.array(categoryFeatureAssignmentItemSchema).min(0),
});

export type ReplaceCategoryFeaturesInput = z.infer<typeof replaceCategoryFeaturesSchema>;
