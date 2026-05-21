import { z } from "zod";

export const branchDesignations = ["regular", "primary", "corporate", "primary_corporate"] as const;
export type BranchDesignation = (typeof branchDesignations)[number];

export const branchStatusValues = ["active", "inactive"] as const;

export const createBranchSchema = z.object({
  branch_name: z.string().min(2).max(255),
  branch_code: z.string().min(2).max(100).regex(/^[A-Za-z0-9-_]+$/),
  country: z.string().min(2),
  state: z.string().min(2),
  city: z.string().min(2),
  pincode: z.string().regex(/^\d{4,10}$/, "PIN code must be 4-10 digits"),
  area: z.string().min(2).max(255),
  address: z.string().optional(),
  status: z.enum(branchStatusValues).default("active"),
  designation: z.enum(branchDesignations).default("regular"),
  enabled_modules: z.array(z.string()).default([]),
  enabled_submodules: z.array(z.string()).default([]),
});

export const updateBranchSchema = createBranchSchema.partial();

export const validateBranchCodeSchema = z.object({
  branch_code: z.string().min(2).max(100),
  exclude_branch_id: z.string().uuid().optional(),
});

export const companyInformationSchema = z.object({
  company_name: z.string().min(2).max(255),
  legal_name: z.string().max(255).optional(),
  business_type: z.string().optional(),
  business_subcategory: z.string().optional(),
  tax_number: z.string().max(100).optional(),
  gst_number: z.string().max(100).optional(),
  pan_number: z.string().max(100).optional(),
  company_email: z.string().email().optional().or(z.literal("")),
  company_phone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal("")),
  country: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  pincode: z.string().regex(/^\d{4,10}$/).optional().or(z.literal("")),
  address: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type CompanyInformationInput = z.infer<typeof companyInformationSchema>;
