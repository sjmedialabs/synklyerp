import { z } from "zod";

export const ACCOUNT_TYPES = ["Header", "Posting"] as const;
export const ACCOUNT_CATEGORIES = ["Assets", "Liabilities", "Equity", "Income", "Expense"] as const;
export const VAT_GST_OPTIONS = ["Yes", "No"] as const;
export const GROUP_TYPES = ["Header", "Group"] as const;
export const DIMENSION_DATA_TYPES = ["List", "Text", "Number"] as const;
export const COST_CENTER_TYPES = ["Administrative", "Operational", "Support", "Production"] as const;

const optionalUuid = z
  .union([z.string().uuid(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (!v || v === "" ? null : v));

export const accountGroupSchema = z.object({
  parentId: optionalUuid,
  code: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  groupType: z.enum(GROUP_TYPES).default("Group"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  allowManualMapping: z.boolean().default(true),
  budgetApplicable: z.boolean().default(false),
  showInReports: z.boolean().default(true),
  costCenterApplicable: z.boolean().default(false),
  profitCenterApplicable: z.boolean().default(false),
});

export const financialDimensionSchema = z.object({
  dimensionCode: z.string().min(1),
  dimensionName: z.string().min(2),
  description: z.string().optional().nullable(),
  dataType: z.enum(DIMENSION_DATA_TYPES).default("List"),
  allowMultipleValues: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const dimensionValueSchema = z.object({
  valueCode: z.string().min(1),
  valueName: z.string().min(1),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().optional(),
});

export const costCenterSchema = z.object({
  parentId: optionalUuid,
  costCenterCode: z.string().min(1),
  costCenterName: z.string().min(2),
  costCenterType: z.enum(COST_CENTER_TYPES).default("Administrative"),
  managerName: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  budgetAmount: z.number().min(0).default(0),
  currency: z.string().min(3).default("INR"),
  allowManualEntry: z.boolean().default(true),
  includeInBudget: z.boolean().default(true),
  allowTransactions: z.boolean().default(true),
  isBillable: z.boolean().default(false),
});

export const chartOfAccountSchema = z.object({
  parentId: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (!v || v === "" ? null : v)),
  accountCode: z.string().min(1),
  accountName: z.string().min(2),
  description: z.string().optional().nullable(),
  accountGroupId: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (!v || v === "" ? null : v)),
  accountType: z.enum(ACCOUNT_TYPES).default("Posting"),
  accountCategory: z.enum(ACCOUNT_CATEGORIES).optional().nullable(),
  currency: z.string().min(3).default("INR"),
  allowManualEntry: z.boolean().default(true),
  isActive: z.boolean().default(true),
  costCenterApplicable: z.boolean().default(false),
  budgetControl: z.boolean().default(false),
  balanceSheetClassification: z.string().optional().nullable(),
  profitLossClassification: z.string().optional().nullable(),
  taxCategory: z.string().optional().nullable(),
  vatGstApplicable: z.enum(VAT_GST_OPTIONS).default("No"),
  sortOrder: z.number().int().optional(),
});

export type AccountGroupInput = z.infer<typeof accountGroupSchema>;
export type FinancialDimensionInput = z.infer<typeof financialDimensionSchema>;
export type DimensionValueInput = z.infer<typeof dimensionValueSchema>;
export type CostCenterInput = z.infer<typeof costCenterSchema>;
export type ChartOfAccountInput = z.infer<typeof chartOfAccountSchema>;
