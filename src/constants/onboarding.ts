export const BUSINESS_TYPES = ["Product", "Service", "Hybrid"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const INDUSTRY_SUBTYPES: Record<BusinessType, readonly string[]> = {
  Product: ["Retail", "Manufacturing", "Wholesale", "E-commerce", "Other"],
  Service: ["IT Services", "Healthcare", "Education", "Consulting", "Restaurant", "Fitness", "Other"],
  Hybrid: ["Retail", "Manufacturing", "IT Services", "Healthcare", "Education", "Consulting", "Other"],
};

export const EMPLOYEE_COUNT_RANGES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export const BUSINESS_SIZES = ["Startup", "SMB", "Mid-Market", "Enterprise"] as const;

/** Maps to existing ERP module keys used in divisions and navigation. */
export const ERP_MODULE_KEYS = [
  "HR",
  "Finance",
  "Sales",
  "Projects",
  "Operations",
  "Marketing",
] as const;

export type ErpModuleKey = (typeof ERP_MODULE_KEYS)[number];

/** Modules activated by business type (maps spec to existing modules). */
export const MODULES_BY_BUSINESS_TYPE: Record<BusinessType, ErpModuleKey[]> = {
  Product: ["Sales", "Operations", "Finance", "HR"],
  Service: ["Sales", "Projects", "Finance", "Marketing", "HR"],
  Hybrid: ["HR", "Finance", "Sales", "Projects", "Operations", "Marketing"],
};

/** Navigation top-level ids gated by module key. */
export const NAV_ID_TO_MODULE: Record<string, ErpModuleKey> = {
  hr: "HR",
  finance: "Finance",
  sales: "Sales",
  marketing: "Marketing",
  projects: "Projects",
  operations: "Operations",
};
