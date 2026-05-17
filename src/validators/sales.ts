import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  leadType: z.string(),
  serviceId: z.string().optional(),
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
});
