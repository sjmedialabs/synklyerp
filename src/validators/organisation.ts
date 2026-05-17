import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  officeType: z.enum(["None", "Primary", "Corporate", "Both"]),
  country: z.string().min(2),
  state: z.string().min(2),
  city: z.string().min(2),
  address: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const divisionSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  modulesAssigned: z.array(z.string()),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const designationSchema = z.object({
  name: z.string().min(2),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const orgUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  userCode: z.string().optional(),
  password: z.string().min(8).optional(),
  designationId: z.string().optional(),
  department: z.string().optional(),
  branchId: z.string().optional(),
  roleId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
