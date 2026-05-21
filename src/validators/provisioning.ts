import { z } from "zod";

export const businessProfileProvisionSchema = z.object({
  business_type_id: z.string().uuid(),
  business_subcategory_id: z.string().uuid(),
  confirmation: z.literal(true),
  employee_count: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).optional(),
  business_size: z.enum(["Startup", "SMB", "Mid-Market", "Enterprise"]).optional(),
});

export type BusinessProfileProvisionInput = z.infer<typeof businessProfileProvisionSchema>;

export const changeBusinessTypeSchema = z.object({
  business_type_id: z.string().uuid(),
  business_subcategory_id: z.string().uuid(),
  reason: z.string().min(10).max(500),
  confirmation: z.literal(true),
});

export type ChangeBusinessTypeInput = z.infer<typeof changeBusinessTypeSchema>;
