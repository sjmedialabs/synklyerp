import type { BusinessTypeConfig } from "./types";

export const serviceBusinessConfig: BusinessTypeConfig = {
  slug: "service",
  legacyKey: "Service",
  modules: [
    { code: "sales", erpModule: "Sales", label: "CRM" },
    { code: "projects", erpModule: "Projects", label: "Project Management" },
    { code: "finance", erpModule: "Finance", label: "Client Billing" },
    { code: "marketing", erpModule: "Marketing", label: "Marketing" },
    { code: "hr", erpModule: "HR", label: "Human Resources" },
  ],
  submodules: [
    { code: "crm", erpModule: "Sales", label: "CRM" },
    { code: "project_management", erpModule: "Projects", label: "Project Management" },
    { code: "task_tracking", erpModule: "Projects", label: "Task Tracking" },
    { code: "resource_allocation", erpModule: "Projects", label: "Resource Allocation" },
    { code: "time_tracking", erpModule: "Projects", label: "Time Tracking" },
    { code: "client_billing", erpModule: "Finance", label: "Client Billing" },
    { code: "appointment_scheduling", erpModule: "Projects", label: "Appointment Scheduling" },
    { code: "sla_management", erpModule: "Finance", label: "SLA Management" },
  ],
  dashboards: [
    { widgetCode: "kpi-leads", order: 1, column: 1, span: 1, visible: true },
    { widgetCode: "kpi-projects", order: 2, column: 2, span: 1, visible: true },
    { widgetCode: "kpi-services", order: 3, column: 3, span: 1, visible: true },
    { widgetCode: "panel-welcome", order: 0, column: 1, span: 4, visible: true },
    { widgetCode: "panel-shortcuts", order: 10, column: 3, span: 1, visible: true },
    { widgetCode: "panel-activity", order: 11, column: 1, span: 2, visible: true },
  ],
  workflows: [
    { workflowCode: "lead-to-project", name: "Lead to Project", steps: ["Lead", "Proposal", "Project", "Delivery"] },
    { workflowCode: "time-to-invoice", name: "Time to Invoice", steps: ["Timesheet", "Approval", "Invoice", "Payment"] },
  ],
  permissions: ["sales:leads:read", "projects:projects:read", "finance:services:read"],
  reports: [
    { reportCode: "project-health", name: "Project Health", moduleKey: "Projects" },
    { reportCode: "utilization", name: "Resource Utilization", moduleKey: "Projects" },
  ],
  navigation: [
    { navId: "sales", moduleKey: "Sales", label: "CRM" },
    { navId: "projects", moduleKey: "Projects", label: "Projects" },
    { navId: "finance", moduleKey: "Finance", label: "Finance" },
    { navId: "marketing", moduleKey: "Marketing", label: "Marketing" },
    { navId: "hr", moduleKey: "HR", label: "HR" },
  ],
  branchDefaults: [
    { branchType: "service-office", enabledModules: ["Projects", "Sales", "Finance"], notes: "Consulting office defaults" },
  ],
  roleTemplates: [
    { templateCode: "project-manager", name: "Project Manager", description: "Owns delivery projects", suggestedPermissions: ["projects:projects:read"] },
    { templateCode: "service-coordinator", name: "Service Coordinator", description: "Schedules service work", suggestedPermissions: ["projects:projects:read"] },
    { templateCode: "account-manager", name: "Account Manager", description: "CRM and client relationships", suggestedPermissions: ["sales:leads:read"] },
  ],
};
