import type { BusinessTypeConfig } from "./types";

const PRODUCT_MODULES = [
  { code: "sales", erpModule: "Sales" as const, label: "Sales Orders" },
  { code: "operations", erpModule: "Operations" as const, label: "Inventory & Warehouse" },
  { code: "finance", erpModule: "Finance" as const, label: "Billing & Invoicing" },
  { code: "hr", erpModule: "HR" as const, label: "Human Resources" },
];

const PRODUCT_SUBMODULES = [
  { code: "inventory_management" as const, erpModule: "Operations" as const, label: "Inventory Management" },
  { code: "procurement" as const, erpModule: "Operations" as const, label: "Procurement" },
  { code: "warehouse_management" as const, erpModule: "Operations" as const, label: "Warehouse Management" },
  { code: "sales_orders" as const, erpModule: "Sales" as const, label: "Sales Orders" },
  { code: "billing_invoicing" as const, erpModule: "Finance" as const, label: "Billing & Invoicing" },
  { code: "manufacturing_support" as const, erpModule: "Operations" as const, label: "Manufacturing Support" },
  { code: "vendor_management" as const, erpModule: "Operations" as const, label: "Vendor Management" },
  { code: "stock_transfers" as const, erpModule: "Operations" as const, label: "Stock Transfers" },
];

export const productBusinessConfig: BusinessTypeConfig = {
  slug: "product",
  legacyKey: "Product",
  modules: PRODUCT_MODULES,
  submodules: PRODUCT_SUBMODULES,
  dashboards: [
    { widgetCode: "kpi-leads", order: 1, column: 1, span: 1, visible: true },
    { widgetCode: "kpi-operations", order: 2, column: 2, span: 1, visible: true },
    { widgetCode: "kpi-services", order: 3, column: 3, span: 1, visible: true },
    { widgetCode: "kpi-attendance", order: 4, column: 4, span: 1, visible: true },
    { widgetCode: "panel-welcome", order: 0, column: 1, span: 4, visible: true },
    { widgetCode: "panel-shortcuts", order: 10, column: 3, span: 1, visible: true },
    { widgetCode: "panel-activity", order: 11, column: 1, span: 2, visible: true },
  ],
  workflows: [
    { workflowCode: "procure-to-pay", name: "Procure to Pay", steps: ["Requisition", "PO", "Receipt", "Invoice"] },
    { workflowCode: "order-to-cash", name: "Order to Cash", steps: ["Quote", "Order", "Fulfillment", "Billing"] },
  ],
  permissions: ["sales:leads:read", "finance:services:read", "organisation:branches:read"],
  reports: [
    { reportCode: "inventory-valuation", name: "Inventory Valuation", moduleKey: "Operations" },
    { reportCode: "sales-pipeline", name: "Sales Pipeline", moduleKey: "Sales" },
  ],
  navigation: [
    { navId: "sales", moduleKey: "Sales", label: "Sales" },
    { navId: "operations", moduleKey: "Operations", label: "Operations" },
    { navId: "finance", moduleKey: "Finance", label: "Finance" },
    { navId: "hr", moduleKey: "HR", label: "HR" },
  ],
  branchDefaults: [
    { branchType: "warehouse", enabledModules: ["Operations", "Finance"], notes: "Default warehouse branch modules" },
    { branchType: "retail-store", enabledModules: ["Sales", "Operations", "Finance"], notes: "Retail POS branch defaults" },
  ],
  roleTemplates: [
    { templateCode: "warehouse-manager", name: "Warehouse Manager", description: "Inventory & warehouse operations", suggestedPermissions: ["organisation:branches:read"] },
    { templateCode: "procurement-officer", name: "Procurement Officer", description: "Procurement lifecycle owner", suggestedPermissions: ["finance:services:read"] },
    { templateCode: "inventory-admin", name: "Inventory Admin", description: "Stock and transfers administrator", suggestedPermissions: ["organisation:branches:read"] },
  ],
};
