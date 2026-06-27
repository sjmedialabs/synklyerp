import { z } from "zod";

export const superAdminTenantPatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  businessTypeSlug: z.string().min(1).max(100).optional(),
  businessSubcategorySlug: z.string().min(1).max(100).optional(),
  reason: z.string().min(3).max(500).optional(),
});

export type SuperAdminTenantPatchInput = z.infer<typeof superAdminTenantPatchSchema>;
