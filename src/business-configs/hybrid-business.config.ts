import type { BusinessTypeConfig } from "./types";

export const hybridBusinessConfig: BusinessTypeConfig = {
  slug: "hybrid",
  legacyKey: "Hybrid",
  modules: [
    { code: "hr", erpModule: "HR", label: "Human Resources" },
    { code: "finance", erpModule: "Finance", label: "Shared Finance" },
    { code: "sales", erpModule: "Sales", label: "Shared CRM" },
    { code: "projects", erpModule: "Projects", label: "Projects" },
    { code: "operations", erpModule: "Operations", label: "Operations" },
    { code: "marketing", erpModule: "Marketing", label: "Marketing" },
  ],
  submodules: [
    { code: "inventory_management", erpModule: "Operations", label: "Inventory Management" },
    { code: "sales_orders", erpModule: "Sales", label: "Sales Orders" },
    { code: "billing_invoicing", erpModule: "Finance", label: "Billing & Invoicing" },
    { code: "crm", erpModule: "Sales", label: "CRM" },
    { code: "project_management", erpModule: "Projects", label: "Project Management" },
    { code: "time_tracking", erpModule: "Projects", label: "Time Tracking" },
    { code: "unified_operations", erpModule: "Operations", label: "Unified Operations" },
    { code: "branch_module_control", erpModule: "Operations", label: "Branch Module Control" },
  ],
  dashboards: [
    { widgetCode: "kpi-leads", order: 1, column: 1, span: 1, visible: true },
    { widgetCode: "kpi-projects", order: 2, column: 2, span: 1, visible: true },
    { widgetCode: "kpi-operations", order: 3, column: 3, span: 1, visible: true },
    { widgetCode: "kpi-services", order: 4, column: 4, span: 1, visible: true },
    { widgetCode: "panel-welcome", order: 0, column: 1, span: 4, visible: true },
    { widgetCode: "panel-shortcuts", order: 10, column: 3, span: 1, visible: true },
    { widgetCode: "panel-activity", order: 11, column: 1, span: 2, visible: true },
  ],
  workflows: [
    { workflowCode: "unified-order-delivery", name: "Unified Order & Delivery", steps: ["Order", "Fulfillment", "Service", "Billing"] },
    { workflowCode: "branch-operations", name: "Branch Operations", steps: ["Branch Setup", "Module Enablement", "Staff Assignment"] },
  ],
  permissions: ["sales:leads:read", "projects:projects:read", "finance:services:read", "organisation:branches:read"],
  reports: [
    { reportCode: "branch-performance", name: "Branch Performance", moduleKey: "Operations" },
    { reportCode: "unified-revenue", name: "Unified Revenue", moduleKey: "Finance" },
  ],
  navigation: [
    { navId: "hr", moduleKey: "HR", label: "HR" },
    { navId: "finance", moduleKey: "Finance", label: "Finance" },
    { navId: "sales", moduleKey: "Sales", label: "Sales" },
    { navId: "projects", moduleKey: "Projects", label: "Projects" },
    { navId: "operations", moduleKey: "Operations", label: "Operations" },
    { navId: "marketing", moduleKey: "Marketing", label: "Marketing" },
  ],
  branchDefaults: [
    { branchType: "head-office", enabledModules: ["HR", "Finance", "Sales", "Projects", "Operations", "Marketing"], notes: "HQ full module access" },
    { branchType: "branch", enabledModules: ["Sales", "Operations", "Finance"], notes: "Branch-level module control" },
  ],
  roleTemplates: [
    { templateCode: "operations-head", name: "Operations Head", description: "Unified operations leader", suggestedPermissions: ["organisation:branches:read"] },
    { templateCode: "branch-manager", name: "Branch Manager", description: "Branch-level control", suggestedPermissions: ["organisation:branches:read"] },
    { templateCode: "crm-manager", name: "CRM Manager", description: "Shared CRM owner", suggestedPermissions: ["sales:leads:read"] },
  ],
};
