import { z } from "zod";

export const employeeSchema = z.object({
  employeeCode: z.string().optional(),
  fullName: z.string().min(2),
  dateOfJoining: z.string(),
  designationId: z.string(),
  department: z.string().optional(),
  branchId: z.string(),
  divisionId: z.string(),
  employmentType: z.string(),
  status: z.string(),
  workEmail: z.string().email().optional().or(z.literal("")),
  personalEmail: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  reportingToId: z.string().optional(),
  isDraft: z.boolean().optional(),
});

export const attendanceSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  punchIn: z.string().optional(),
  punchOut: z.string().optional(),
  status: z.string(),
  otHours: z.number().min(0).optional(),
  flags: z.string().optional(),
});

export const payrollCycleSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});
