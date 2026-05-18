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

const optionalUuid = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === "" ? null : v));

const optionalPassword = z
  .union([z.string().min(8), z.literal("")])
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : v));

export const orgUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  userCode: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  designationId: optionalUuid,
  department: z.string().optional(),
  branchId: optionalUuid,
  roleId: optionalUuid,
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const orgUserCreateSchema = orgUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** Client form: allows empty password on edit; FK ids stay as strings until API */
export const orgUserFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  userCode: z.string().optional(),
  password: z.union([z.string().min(8), z.literal("")]).optional(),
  designationId: z.string().optional(),
  department: z.string().optional(),
  branchId: z.string().optional(),
  roleId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

/** Update: all fields optional; empty password and FK ids normalized */
export const orgUserUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  userCode: z.string().optional(),
  password: optionalPassword,
  designationId: optionalUuid.optional(),
  department: z.string().optional(),
  branchId: optionalUuid.optional(),
  roleId: optionalUuid.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
