import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(2),
  clientName: z.string().min(2),
  managerName: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  budget: z.number().optional(),
  progress: z.number().min(0).max(100).default(0),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
});
