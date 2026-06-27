/**
 * Canonical menu catalog used ONLY for database seeding.
 * Runtime sidebar always loads from `sidebar_menus` table.
 */
export type MenuSeedNode = {
  slug: string;
  name: string;
  path?: string;
  icon?: string;
  moduleKey?: string;
  menuType?: "section" | "group" | "item";
  permissionModule?: string;
  permissionFeature?: string;
  requiredPlan?: string;
  requiredBusinessTypes?: string[];
  hiddenForBusinessTypes?: string[];
  requiredSubmodules?: string[];
  featureFlagKey?: string;
  status?: "built" | "scope" | "pending";
  badge?: string;
  sortOrder?: number;
  children?: MenuSeedNode[];
};

export const SIDEBAR_MENU_CATALOG: MenuSeedNode[] = [
  {
    slug: "dashboard",
    name: "Dashboard",
    path: "/app",
    icon: "layout-dashboard",
    menuType: "item",
    sortOrder: 0,
    status: "built",
  },
  {
    slug: "setup",
    name: "Organization Setup",
    icon: "building-2",
    menuType: "section",
    sortOrder: 10,
    children: [
      { slug: "business-type", name: "Business Type", path: "/app/setup/business-type", icon: "layers", status: "built", sortOrder: 1 },
      { slug: "company-info", name: "Company Information", path: "/app/setup/organisation/company-information", icon: "building", status: "built", sortOrder: 2 },
      { slug: "branch-mgmt", name: "Branch Management", path: "/app/setup/organisation/branches", icon: "map-pin", status: "built", sortOrder: 3 },
      { slug: "branches", name: "Branch Management", path: "/app/organisation/branches", icon: "git-branch", permissionModule: "organisation", permissionFeature: "branches", status: "built", sortOrder: 4 },
      { slug: "divisions", name: "Divisions", path: "/app/organisation/divisions", icon: "network", permissionModule: "organisation", permissionFeature: "divisions", status: "built", sortOrder: 5 },
      { slug: "designations", name: "Designations", path: "/app/organisation/designations", icon: "badge-check", permissionModule: "organisation", permissionFeature: "designations", status: "built", sortOrder: 6 },
      { slug: "users", name: "Users & Roles", path: "/app/organisation/users", icon: "users", permissionModule: "organisation", permissionFeature: "users", status: "built", sortOrder: 7 },
      { slug: "taxes", name: "Taxes", path: "/app/organisation/taxes", icon: "receipt", permissionModule: "organisation", permissionFeature: "taxes", status: "built", sortOrder: 8 },
      { slug: "approval-workflows", name: "Approval Workflows", path: "/app/setup/approval-workflows", icon: "git-merge", status: "pending", sortOrder: 9 },
      { slug: "business-settings", name: "Business Settings", path: "/app/setup/business-settings", icon: "settings-2", status: "pending", sortOrder: 10 },
    ],
  },
  {
    slug: "hr",
    name: "Human Resource",
    icon: "users",
    moduleKey: "HR",
    menuType: "section",
    sortOrder: 20,
    permissionModule: "hr",
    permissionFeature: "employees",
    children: [
      { slug: "employees", name: "Employee Management", path: "/app/hr/employees", icon: "user-check", permissionModule: "hr", permissionFeature: "employees", status: "built", sortOrder: 1 },
      { slug: "attendance", name: "Attendance & Leave", path: "/app/hr/attendance", icon: "calendar-check", permissionModule: "hr", permissionFeature: "attendance", status: "built", sortOrder: 2 },
      { slug: "payroll", name: "Payroll & Compensation", path: "/app/hr/payroll", icon: "banknote", permissionModule: "hr", permissionFeature: "payroll", status: "built", sortOrder: 3 },
      { slug: "performance", name: "Performance Management", path: "/app/hr/performance", icon: "trending-up", permissionModule: "hr", permissionFeature: "employees", status: "scope", sortOrder: 4 },
      { slug: "recruitment", name: "Recruitment & Hiring", path: "/app/hr/recruitment", icon: "user-plus", status: "pending", sortOrder: 5 },
      { slug: "hr-documents", name: "Employee Documents", path: "/app/hr/documents", icon: "file-text", status: "pending", sortOrder: 6 },
      { slug: "hr-policies", name: "HR Policies", path: "/app/hr/policies", icon: "book-open", status: "pending", sortOrder: 7 },
      { slug: "asset-allocation", name: "Asset Allocation", path: "/app/hr/assets", icon: "package", status: "pending", sortOrder: 8 },
    ],
  },
  {
    slug: "finance",
    name: "Finance",
    icon: "receipt",
    moduleKey: "Finance",
    menuType: "section",
    sortOrder: 30,
    permissionModule: "finance",
    permissionFeature: "services",
    children: [
      { slug: "accounting", name: "Accounting", path: "/app/finance/accounting", icon: "calculator", status: "pending", sortOrder: 1 },
      { slug: "invoicing", name: "Invoicing", path: "/app/finance/invoicing", icon: "file-text", status: "pending", sortOrder: 2 },
      { slug: "budgeting", name: "Budgeting", path: "/app/finance/budgeting", icon: "pie-chart", status: "pending", sortOrder: 3 },
      { slug: "expenses", name: "Expenses", path: "/app/finance/expenses", icon: "wallet", status: "pending", sortOrder: 4 },
      { slug: "tax-mgmt", name: "Tax Management", path: "/app/finance/tax-management", icon: "percent", status: "pending", sortOrder: 5 },
      { slug: "banking", name: "Banking", path: "/app/finance/banking", icon: "landmark", status: "pending", sortOrder: 6 },
      { slug: "vendor-payments", name: "Vendor Payments", path: "/app/finance/vendor-payments", icon: "hand-coins", status: "pending", sortOrder: 7 },
      { slug: "purchase-orders", name: "Purchase Orders", path: "/app/finance/purchase-orders", icon: "shopping-cart", status: "pending", sortOrder: 8 },
      { slug: "financial-reports", name: "Financial Reports", path: "/app/finance/reports", icon: "bar-chart-3", status: "pending", sortOrder: 9 },
      { slug: "multi-currency", name: "Multi Currency", path: "/app/finance/multi-currency", icon: "coins", status: "pending", sortOrder: 10 },
      { slug: "cost-centers", name: "Cost Centers", path: "/app/finance/cost-centers", icon: "target", status: "pending", sortOrder: 11 },
      {
        slug: "services-hub",
        name: "Services Hub",
        icon: "briefcase",
        menuType: "group",
        hiddenForBusinessTypes: ["Product"],
        requiredSubmodules: ["crm", "client_billing", "sla_management"],
        sortOrder: 12,
        children: [
          { slug: "service-catalog", name: "Service Catalog", path: "/app/finance/services", icon: "list", permissionModule: "finance", permissionFeature: "services", status: "built", sortOrder: 1 },
          { slug: "pricing-rules", name: "Pricing Rules", path: "/app/finance/services/pricing", icon: "tag", permissionModule: "finance", permissionFeature: "pricing", status: "built", sortOrder: 2 },
          { slug: "packages", name: "Service Packages", path: "/app/finance/services/packages", icon: "package", permissionModule: "finance", permissionFeature: "packages", status: "built", sortOrder: 3 },
          { slug: "sla", name: "SLA & Policies", path: "/app/finance/services/sla", icon: "shield-check", permissionModule: "finance", permissionFeature: "sla", status: "built", sortOrder: 4 },
          { slug: "service-contracts", name: "Service Contracts", path: "/app/finance/services/contracts", icon: "file-signature", status: "pending", sortOrder: 5 },
          { slug: "amc-management", name: "AMC Management", path: "/app/finance/services/amc", icon: "wrench", status: "pending", sortOrder: 6 },
          { slug: "subscription-billing", name: "Subscription Billing", path: "/app/finance/services/subscriptions", icon: "repeat", status: "pending", sortOrder: 7 },
          { slug: "service-requests", name: "Service Requests", path: "/app/finance/services/requests", icon: "inbox", status: "pending", sortOrder: 8 },
        ],
      },
    ],
  },
  {
    slug: "sales",
    name: "Sales & CRM",
    icon: "briefcase",
    moduleKey: "Sales",
    menuType: "section",
    sortOrder: 40,
    permissionModule: "sales",
    permissionFeature: "leads",
    requiredSubmodules: ["crm", "sales_orders"],
    children: [
      { slug: "leads", name: "Lead Management", path: "/app/sales/leads", icon: "user-plus", permissionModule: "sales", permissionFeature: "leads", status: "built", sortOrder: 1 },
      { slug: "opportunities", name: "Opportunity Pipeline", path: "/app/sales/opportunities", icon: "funnel", status: "pending", sortOrder: 2 },
      { slug: "quotations", name: "Quotations", path: "/app/sales/quotations", icon: "file-check", status: "pending", sortOrder: 3 },
      { slug: "orders", name: "Orders & Invoices", path: "/app/sales/orders", icon: "shopping-bag", status: "pending", sortOrder: 4 },
      { slug: "customers", name: "Customer Management", path: "/app/sales/customers", icon: "users", status: "pending", sortOrder: 5 },
      { slug: "targets", name: "Targets & Quotas", path: "/app/sales/targets", icon: "target", status: "pending", sortOrder: 6 },
      { slug: "crm-automation", name: "CRM Automation", path: "/app/sales/automation", icon: "zap", status: "pending", sortOrder: 7 },
      { slug: "api-forms", name: "API & Forms", path: "/app/sales/api-forms", icon: "code", status: "pending", sortOrder: 8 },
      { slug: "customer-support", name: "Customer Support", path: "/app/sales/support", icon: "headphones", status: "pending", sortOrder: 9 },
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    icon: "megaphone",
    moduleKey: "Marketing",
    menuType: "section",
    sortOrder: 50,
    requiredPlan: "professional",
    requiredSubmodules: ["marketing_campaigns"],
    children: [
      { slug: "campaigns", name: "Campaigns", path: "/app/marketing/campaigns", icon: "megaphone", status: "pending", sortOrder: 1 },
      { slug: "email", name: "Email Marketing", path: "/app/marketing/email", icon: "mail", status: "pending", sortOrder: 2 },
      { slug: "seo", name: "SEO & Analytics", path: "/app/marketing/seo", icon: "search", status: "pending", sortOrder: 3 },
      { slug: "social-media", name: "Social Media", path: "/app/marketing/social", icon: "share-2", status: "pending", sortOrder: 4 },
      { slug: "landing-pages", name: "Landing Pages", path: "/app/marketing/landing-pages", icon: "layout", status: "pending", sortOrder: 5 },
      { slug: "lead-funnels", name: "Lead Funnels", path: "/app/marketing/funnels", icon: "filter", status: "pending", sortOrder: 6 },
      { slug: "whatsapp-campaigns", name: "WhatsApp Campaigns", path: "/app/marketing/whatsapp", icon: "message-circle", status: "pending", sortOrder: 7 },
      { slug: "marketing-automation", name: "Marketing Automation", path: "/app/marketing/automation", icon: "bot", status: "pending", sortOrder: 8 },
    ],
  },
  {
    slug: "projects",
    name: "Project Management",
    icon: "folder-kanban",
    moduleKey: "Projects",
    menuType: "section",
    sortOrder: 60,
    requiredPlan: "professional",
    requiredSubmodules: ["project_management", "task_tracking", "time_tracking"],
    permissionModule: "projects",
    permissionFeature: "projects",
    children: [
      { slug: "bucket", name: "Project Planning", path: "/app/projects/bucket", icon: "folder-kanban", permissionModule: "projects", permissionFeature: "projects", status: "built", sortOrder: 1 },
      { slug: "tasks", name: "Task Tracking", path: "/app/projects/tasks", icon: "check-square", status: "pending", sortOrder: 2 },
      { slug: "milestones", name: "Milestones", path: "/app/projects/milestones", icon: "flag", status: "pending", sortOrder: 3 },
      { slug: "resources", name: "Resource Allocation", path: "/app/projects/resources", icon: "users", status: "pending", sortOrder: 4 },
      { slug: "timesheets", name: "Timesheets", path: "/app/projects/timesheets", icon: "clock", status: "pending", sortOrder: 5 },
      { slug: "risk", name: "Risk Management", path: "/app/projects/risk", icon: "alert-triangle", status: "pending", sortOrder: 6 },
      { slug: "sprints", name: "Sprint Management", path: "/app/projects/sprints", icon: "rocket", status: "pending", sortOrder: 7 },
      { slug: "gantt", name: "Gantt Charts", path: "/app/projects/gantt", icon: "gantt-chart", status: "pending", sortOrder: 8 },
      { slug: "kanban", name: "Kanban Board", path: "/app/projects/kanban", icon: "columns", status: "pending", sortOrder: 9 },
      { slug: "deliverables", name: "Client Deliverables", path: "/app/projects/deliverables", icon: "package-check", status: "pending", sortOrder: 10 },
    ],
  },
  {
    slug: "operations",
    name: "Operations",
    icon: "wrench",
    moduleKey: "Operations",
    menuType: "section",
    sortOrder: 70,
    requiredSubmodules: ["inventory_management", "warehouse_management", "procurement"],
    children: [
      { slug: "op-dashboard", name: "Operations Dashboard", path: "/app/operations", icon: "layout-dashboard", status: "pending", sortOrder: 1 },
      { slug: "op-task", name: "Internal Tasks", path: "/app/operations/tasks", icon: "list-todo", status: "pending", sortOrder: 2 },
      { slug: "op-maint", name: "Maintenance", path: "/app/operations/maintenance", icon: "wrench", status: "pending", sortOrder: 3 },
      { slug: "asset-mgmt", name: "Asset Management", path: "/app/operations/assets", icon: "hard-drive", status: "pending", sortOrder: 4 },
      { slug: "procurement", name: "Procurement", path: "/app/operations/procurement", icon: "truck", status: "pending", sortOrder: 5 },
      { slug: "inventory-ops", name: "Inventory Operations", path: "/app/operations/inventory", icon: "warehouse", status: "pending", sortOrder: 6 },
      { slug: "workflow-automation", name: "Workflow Automation", path: "/app/operations/workflows", icon: "workflow", status: "pending", sortOrder: 7 },
      { slug: "compliance", name: "Compliance Tracking", path: "/app/operations/compliance", icon: "shield", status: "pending", sortOrder: 8 },
    ],
  },
  {
    slug: "reports",
    name: "Reports & Analytics",
    icon: "bar-chart-3",
    menuType: "section",
    sortOrder: 80,
    requiredPlan: "professional",
    children: [
      { slug: "business-reports", name: "Business Reports", path: "/app/reports/business", icon: "bar-chart", status: "pending", sortOrder: 1 },
      { slug: "financial-reports-hub", name: "Financial Reports", path: "/app/reports/financial", icon: "line-chart", status: "pending", sortOrder: 2 },
      { slug: "hr-reports", name: "HR Reports", path: "/app/reports/hr", icon: "users", status: "pending", sortOrder: 3 },
      { slug: "operational-reports", name: "Operational Reports", path: "/app/reports/operations", icon: "activity", status: "pending", sortOrder: 4 },
      { slug: "report-builder", name: "Custom Report Builder", path: "/app/reports/builder", icon: "blocks", status: "pending", sortOrder: 5 },
      { slug: "dashboard-analytics", name: "Dashboard Analytics", path: "/app/reports/analytics", icon: "pie-chart", status: "pending", sortOrder: 6 },
      { slug: "export-center", name: "Export Center", path: "/app/reports/export", icon: "download", status: "pending", sortOrder: 7 },
    ],
  },
  {
    slug: "administration",
    name: "Administration",
    icon: "shield",
    menuType: "section",
    sortOrder: 90,
    requiredPlan: "enterprise",
    children: [
      { slug: "roles-permissions", name: "Roles & Permissions", path: "/app/admin/roles", icon: "key", status: "pending", sortOrder: 1 },
      { slug: "workflow-engine", name: "Workflow Engine", path: "/app/admin/workflows", icon: "workflow", featureFlagKey: "workflow_engine", status: "pending", sortOrder: 2 },
      { slug: "audit-logs", name: "Audit Logs", path: "/app/admin/audit-logs", icon: "scroll-text", featureFlagKey: "audit_logs", status: "pending", sortOrder: 3 },
      { slug: "notification-templates", name: "Notification Templates", path: "/app/admin/notifications", icon: "bell", status: "pending", sortOrder: 4 },
      { slug: "activity-timeline", name: "Activity Timeline", path: "/app/admin/activity", icon: "history", status: "pending", sortOrder: 5 },
      { slug: "api-keys", name: "API Keys", path: "/app/admin/api-keys", icon: "key-round", featureFlagKey: "api_access", status: "pending", sortOrder: 6 },
      { slug: "integrations", name: "Integrations", path: "/app/admin/integrations", icon: "plug", status: "pending", sortOrder: 7 },
      { slug: "webhooks", name: "Webhooks", path: "/app/admin/webhooks", icon: "webhook", status: "pending", sortOrder: 8 },
      { slug: "system-settings", name: "System Settings", path: "/app/admin/settings", icon: "settings", status: "pending", sortOrder: 9 },
    ],
  },
  {
    slug: "account",
    name: "Account",
    icon: "settings",
    menuType: "section",
    sortOrder: 100,
    children: [
      { slug: "profile", name: "Profile", path: "/app/account/profile", icon: "user", status: "pending", sortOrder: 1 },
      { slug: "security", name: "Security", path: "/app/account/security", icon: "lock", status: "pending", sortOrder: 2 },
      { slug: "notifications-pref", name: "Notifications", path: "/app/account/notifications", icon: "bell", status: "pending", sortOrder: 3 },
      { slug: "subscription", name: "Subscription", path: "/app/account/subscription", icon: "credit-card", status: "pending", sortOrder: 4 },
      { slug: "billing", name: "Billing", path: "/app/account/billing", icon: "receipt", status: "pending", sortOrder: 5 },
      { slug: "connected-apps", name: "Connected Apps", path: "/app/account/apps", icon: "plug", status: "pending", sortOrder: 6 },
      { slug: "preferences", name: "Preferences", path: "/app/account/preferences", icon: "sliders", status: "pending", sortOrder: 7 },
      { slug: "settings", name: "Settings", path: "/app/settings", icon: "settings", status: "built", sortOrder: 8 },
    ],
  },
];

export const PLAN_RANK: Record<string, number> = {
  starter: 1,
  basic: 1,
  professional: 2,
  enterprise: 3,
};

export const ALWAYS_VISIBLE_SLUGS = new Set(["dashboard", "setup", "account", "business-type", "company-info", "branch-mgmt", "settings"]);

/** Legacy sidebar slug removed from the catalog (Organization Directory hub only). */
export const REMOVED_MENU_SLUGS = new Set(["organisation-hub"]);
