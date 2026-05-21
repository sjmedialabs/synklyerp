export const BUSINESS_TYPES = ["Product", "Service", "Hybrid"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_DESCRIPTIONS: Record<
  BusinessType,
  { title: string; description: string }
> = {
  Product: {
    title: "Product-Based",
    description: "Businesses primarily selling physical or digital products",
  },
  Service: {
    title: "Service-Based",
    description: "Businesses providing services, consulting, or expertise",
  },
  Hybrid: {
    title: "Hybrid",
    description: "Businesses operating both products and services",
  },
};

/** PRD scope bullets shown during onboarding. */
export const BUSINESS_TYPE_SCOPE: Record<BusinessType, readonly string[]> = {
  Product: [
    "Inventory Management",
    "Procurement",
    "Warehouse Management",
    "Sales Orders",
    "Billing & Invoicing",
    "Manufacturing Support",
    "Stock Transfers",
    "Vendor Management",
  ],
  Service: [
    "CRM",
    "Project Management",
    "Task Tracking",
    "Resource Allocation",
    "Time Tracking",
    "Client Billing",
    "Appointment Scheduling",
    "SLA Management",
  ],
  Hybrid: [
    "Product Modules",
    "Service Modules",
    "Shared Finance",
    "Shared CRM",
    "Unified Operations",
    "Branch-Level Module Control",
  ],
};

export const INDUSTRY_SUBTYPES: Record<BusinessType, readonly string[]> = {
  Product: ["Manufacturing", "Retail", "E-Commerce", "FMCG", "Food & Beverage", "Distribution", "Wholesale"],
  Service: [
    "IT Services",
    "Healthcare",
    "Education",
    "Consulting",
    "Finance",
    "Legal Services",
    "Marketing Agency",
  ],
  Hybrid: ["Restaurant", "Fitness", "Wellness", "Franchise", "Automobile", "Electronics", "Healthcare Chains"],
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

/** Logical capability keys provisioned alongside ERP modules. */
export const ERP_SUBMODULE_KEYS = [
  "inventory_management",
  "procurement",
  "warehouse_management",
  "sales_orders",
  "billing_invoicing",
  "manufacturing_support",
  "stock_transfers",
  "vendor_management",
  "crm",
  "project_management",
  "task_tracking",
  "resource_allocation",
  "time_tracking",
  "client_billing",
  "appointment_scheduling",
  "sla_management",
  "unified_operations",
  "branch_module_control",
  "marketing_campaigns",
] as const;

export type ErpSubmoduleKey = (typeof ERP_SUBMODULE_KEYS)[number];

export const SUBMODULE_LABELS: Record<ErpSubmoduleKey, string> = {
  inventory_management: "Inventory Management",
  procurement: "Procurement",
  warehouse_management: "Warehouse Management",
  sales_orders: "Sales Orders",
  billing_invoicing: "Billing & Invoicing",
  manufacturing_support: "Manufacturing Support",
  stock_transfers: "Stock Transfers",
  vendor_management: "Vendor Management",
  crm: "CRM",
  project_management: "Project Management",
  task_tracking: "Task Tracking",
  resource_allocation: "Resource Allocation",
  time_tracking: "Time Tracking",
  client_billing: "Client Billing",
  appointment_scheduling: "Appointment Scheduling",
  sla_management: "SLA Management",
  unified_operations: "Unified Operations",
  branch_module_control: "Branch Module Control",
  marketing_campaigns: "Marketing Campaigns",
};

/** Modules activated by business type (maps spec to existing modules). */
export const MODULES_BY_BUSINESS_TYPE: Record<BusinessType, ErpModuleKey[]> = {
  Product: ["Sales", "Operations", "Finance", "HR"],
  Service: ["Sales", "Projects", "Finance", "Marketing", "HR"],
  Hybrid: ["HR", "Finance", "Sales", "Projects", "Operations", "Marketing"],
};

const PRODUCT_SUBMODULES: ErpSubmoduleKey[] = [
  "inventory_management",
  "procurement",
  "warehouse_management",
  "sales_orders",
  "billing_invoicing",
  "manufacturing_support",
  "stock_transfers",
  "vendor_management",
];

const SERVICE_SUBMODULES: ErpSubmoduleKey[] = [
  "crm",
  "project_management",
  "task_tracking",
  "resource_allocation",
  "time_tracking",
  "client_billing",
  "appointment_scheduling",
  "sla_management",
];

const HYBRID_BASE_SUBMODULES: ErpSubmoduleKey[] = [
  ...PRODUCT_SUBMODULES,
  ...SERVICE_SUBMODULES,
  "unified_operations",
  "branch_module_control",
];

/** Submodules activated by business type before subcategory refinement. */
export const SUBMODULES_BY_BUSINESS_TYPE: Record<BusinessType, ErpSubmoduleKey[]> = {
  Product: PRODUCT_SUBMODULES,
  Service: SERVICE_SUBMODULES,
  Hybrid: HYBRID_BASE_SUBMODULES,
};

/** Subcategory-level module refinements (overrides business-type defaults when set). */
export const MODULES_BY_INDUSTRY_SUBTYPE: Record<string, ErpModuleKey[]> = {
  Manufacturing: ["Sales", "Operations", "Finance", "HR"],
  Retail: ["Sales", "Operations", "Finance", "HR"],
  "E-Commerce": ["Sales", "Operations", "Finance", "HR", "Marketing"],
  FMCG: ["Sales", "Operations", "Finance", "HR"],
  "Food & Beverage": ["Sales", "Operations", "Finance", "HR"],
  Distribution: ["Sales", "Operations", "Finance", "HR"],
  Wholesale: ["Sales", "Operations", "Finance", "HR"],
  "IT Services": ["Sales", "Projects", "Finance", "Marketing", "HR"],
  Healthcare: ["Sales", "Projects", "Finance", "HR"],
  Education: ["Sales", "Projects", "Finance", "HR"],
  Consulting: ["Sales", "Projects", "Finance", "Marketing", "HR"],
  Finance: ["Sales", "Finance", "Projects", "HR"],
  "Legal Services": ["Sales", "Projects", "Finance", "HR"],
  "Marketing Agency": ["Sales", "Projects", "Finance", "Marketing", "HR"],
  Restaurant: ["Sales", "Operations", "Finance", "HR", "Projects"],
  Fitness: ["Sales", "Projects", "Finance", "HR", "Marketing"],
  Wellness: ["Sales", "Projects", "Finance", "HR", "Marketing"],
  Franchise: ["Sales", "Operations", "Finance", "HR", "Projects", "Marketing"],
  Automobile: ["Sales", "Operations", "Finance", "HR", "Projects"],
  Electronics: ["Sales", "Operations", "Finance", "HR", "Projects", "Marketing"],
  "Healthcare Chains": ["Sales", "Projects", "Finance", "HR", "Operations"],
};

/** Subcategory-level submodule refinements. */
export const SUBMODULES_BY_INDUSTRY_SUBTYPE: Record<string, ErpSubmoduleKey[]> = {
  Manufacturing: [
    "inventory_management",
    "procurement",
    "warehouse_management",
    "sales_orders",
    "billing_invoicing",
    "manufacturing_support",
    "stock_transfers",
    "vendor_management",
  ],
  Retail: [
    "inventory_management",
    "sales_orders",
    "billing_invoicing",
    "vendor_management",
    "warehouse_management",
  ],
  "E-Commerce": [
    "inventory_management",
    "sales_orders",
    "billing_invoicing",
    "marketing_campaigns",
    "warehouse_management",
  ],
  FMCG: [
    "inventory_management",
    "procurement",
    "warehouse_management",
    "sales_orders",
    "stock_transfers",
    "vendor_management",
    "billing_invoicing",
  ],
  "Food & Beverage": [
    "inventory_management",
    "procurement",
    "sales_orders",
    "billing_invoicing",
    "warehouse_management",
  ],
  Distribution: [
    "inventory_management",
    "procurement",
    "warehouse_management",
    "sales_orders",
    "stock_transfers",
    "vendor_management",
    "billing_invoicing",
  ],
  Wholesale: [
    "inventory_management",
    "procurement",
    "warehouse_management",
    "sales_orders",
    "vendor_management",
    "billing_invoicing",
  ],
  "IT Services": [
    "crm",
    "project_management",
    "task_tracking",
    "time_tracking",
    "client_billing",
    "sla_management",
    "resource_allocation",
  ],
  Healthcare: ["crm", "appointment_scheduling", "client_billing", "task_tracking", "sla_management"],
  Education: ["crm", "project_management", "client_billing", "task_tracking"],
  Consulting: ["crm", "project_management", "time_tracking", "client_billing", "resource_allocation"],
  Finance: ["crm", "client_billing", "sla_management", "project_management"],
  "Legal Services": ["crm", "project_management", "client_billing", "time_tracking", "sla_management"],
  "Marketing Agency": [
    "crm",
    "project_management",
    "task_tracking",
    "marketing_campaigns",
    "client_billing",
  ],
  Restaurant: [
    "inventory_management",
    "sales_orders",
    "billing_invoicing",
    "appointment_scheduling",
    "task_tracking",
    "unified_operations",
  ],
  Fitness: [
    "crm",
    "appointment_scheduling",
    "client_billing",
    "sales_orders",
    "task_tracking",
    "marketing_campaigns",
    "unified_operations",
  ],
  Wellness: [
    "crm",
    "appointment_scheduling",
    "client_billing",
    "project_management",
    "marketing_campaigns",
    "unified_operations",
  ],
  Franchise: [...HYBRID_BASE_SUBMODULES, "marketing_campaigns"],
  Automobile: [
    "inventory_management",
    "sales_orders",
    "billing_invoicing",
    "manufacturing_support",
    "vendor_management",
    "project_management",
    "crm",
  ],
  Electronics: [
    "inventory_management",
    "sales_orders",
    "billing_invoicing",
    "warehouse_management",
    "project_management",
    "crm",
    "marketing_campaigns",
  ],
  "Healthcare Chains": [
    "crm",
    "appointment_scheduling",
    "client_billing",
    "branch_module_control",
    "inventory_management",
    "sla_management",
    "unified_operations",
  ],
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

/** Maps permission module slugs to ERP module keys for access control. */
export const PERM_MODULE_TO_ERP: Record<string, ErpModuleKey | "organisation" | "tenant"> = {
  organisation: "organisation",
  hr: "HR",
  finance: "Finance",
  sales: "Sales",
  projects: "Projects",
  marketing: "Marketing",
  tenant: "tenant",
};
