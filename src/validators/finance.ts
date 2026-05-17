import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  unit: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const pricingRuleSchema = z.object({
  name: z.string().min(2),
  segment: z.string().optional(),
  condition: z.string().optional(),
  adjustment: z.number(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const servicePackageSchema = z.object({
  name: z.string().min(2),
  includedServices: z.array(z.unknown()),
  discount: z.number().min(0).max(100),
  validityDays: z.number().int().positive().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const serviceSlaSchema = z.object({
  serviceName: z.string().min(2),
  responseTime: z.string().min(1),
  resolutionTime: z.string().min(1),
  escalationRules: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const orgTaxSchema = z.object({
  name: z.string().min(2),
  rate: z.number().min(0),
  type: z.string().min(2),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
