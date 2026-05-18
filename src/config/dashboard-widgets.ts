import type { AppRole } from "@/types/auth";
import type { BusinessType, ErpModuleKey } from "@/constants/onboarding";

export type DashboardWidgetType = "kpi" | "activity" | "quick_actions" | "welcome";

export type DashboardWidgetDef = {
  id: string;
  type: DashboardWidgetType;
  label: string;
  description?: string;
  /** ERP module gate; omit for organisation-wide widgets */
  moduleKey?: ErpModuleKey | "organisation";
  permission?: { module: string; feature: string; action?: string };
  roles?: AppRole[];
  businessTypes?: BusinessType[];
  apiUrl?: string;
  href?: string;
  icon: string;
  priority: number;
  valueKey?: string;
  subKey?: string;
  subLabel?: string;
  span?: "kpi" | "wide" | "sidebar";
};

export type DashboardShortcutDef = {
  id: string;
  label: string;
  href: string;
  moduleKey?: ErpModuleKey | "organisation";
  permission: { module: string; feature: string; action?: string };
  priority: number;
};

export const DASHBOARD_KPI_WIDGETS: DashboardWidgetDef[] = [
  {
    id: "kpi-users",
    type: "kpi",
    label: "Organisation Users",
    moduleKey: "organisation",
    permission: { module: "organisation", feature: "users" },
    apiUrl: "/api/organisation/users/stats",
    href: "/app/organisation/users",
    icon: "Users",
    priority: 10,
    valueKey: "total",
    subKey: "active",
    subLabel: "active",
  },
  {
    id: "kpi-employees",
    type: "kpi",
    label: "Employees",
    moduleKey: "HR",
    permission: { module: "hr", feature: "employees" },
    apiUrl: "/api/hr/employees/stats",
    href: "/app/hr/employees",
    icon: "Briefcase",
    priority: 20,
    valueKey: "total",
    subKey: "active",
    subLabel: "active",
    businessTypes: ["Product", "Service", "Hybrid"],
  },
  {
    id: "kpi-attendance",
    type: "kpi",
    label: "Present Today",
    description: "Attendance snapshot",
    moduleKey: "HR",
    permission: { module: "hr", feature: "attendance" },
    apiUrl: "/api/hr/attendance/summary",
    href: "/app/hr/attendance",
    icon: "UserCheck",
    priority: 25,
    valueKey: "present",
    subKey: "onLeave",
    subLabel: "on leave",
    businessTypes: ["Product", "Hybrid"],
  },
  {
    id: "kpi-leads",
    type: "kpi",
    label: "Sales Leads",
    moduleKey: "Sales",
    permission: { module: "sales", feature: "leads" },
    apiUrl: "/api/sales/leads/stats",
    href: "/app/sales/leads",
    icon: "Target",
    priority: 30,
    valueKey: "total",
    businessTypes: ["Product", "Service", "Hybrid"],
  },
  {
    id: "kpi-projects",
    type: "kpi",
    label: "Active Projects",
    moduleKey: "Projects",
    permission: { module: "projects", feature: "projects" },
    apiUrl: "/api/projects/stats",
    href: "/app/projects/bucket",
    icon: "FolderKanban",
    priority: 40,
    valueKey: "total",
    businessTypes: ["Service", "Hybrid"],
  },
  {
    id: "kpi-services",
    type: "kpi",
    label: "Finance Services",
    moduleKey: "Finance",
    permission: { module: "finance", feature: "services" },
    apiUrl: "/api/finance/services/stats",
    href: "/app/finance/services",
    icon: "Receipt",
    priority: 50,
    valueKey: "total",
    subKey: "active",
    subLabel: "active",
    businessTypes: ["Product", "Service", "Hybrid"],
  },
];

export const DASHBOARD_PANEL_WIDGETS: DashboardWidgetDef[] = [
  {
    id: "panel-activity",
    type: "activity",
    label: "Recent activity",
    icon: "Activity",
    priority: 100,
    span: "wide",
  },
  {
    id: "panel-shortcuts",
    type: "quick_actions",
    label: "Quick actions",
    icon: "Zap",
    priority: 110,
    span: "sidebar",
  },
  {
    id: "panel-welcome",
    type: "welcome",
    label: "Workspace overview",
    icon: "LayoutDashboard",
    priority: 5,
    span: "wide",
  },
];

export const DASHBOARD_SHORTCUTS: DashboardShortcutDef[] = [
  {
    id: "sc-branch",
    label: "Add Branch",
    href: "/app/organisation/branches",
    moduleKey: "organisation",
    permission: { module: "organisation", feature: "branches", action: "create" },
    priority: 10,
  },
  {
    id: "sc-employee",
    label: "Add Employee",
    href: "/app/hr/employees",
    moduleKey: "HR",
    permission: { module: "hr", feature: "employees", action: "create" },
    priority: 20,
  },
  {
    id: "sc-lead",
    label: "New Lead",
    href: "/app/sales/leads",
    moduleKey: "Sales",
    permission: { module: "sales", feature: "leads", action: "create" },
    priority: 30,
  },
  {
    id: "sc-service",
    label: "Service Catalog",
    href: "/app/finance/services",
    moduleKey: "Finance",
    permission: { module: "finance", feature: "services", action: "create" },
    priority: 40,
  },
  {
    id: "sc-attendance",
    label: "Mark Attendance",
    href: "/app/hr/attendance",
    moduleKey: "HR",
    permission: { module: "hr", feature: "attendance", action: "create" },
    priority: 50,
  },
  {
    id: "sc-project",
    label: "New Project",
    href: "/app/projects/bucket",
    moduleKey: "Projects",
    permission: { module: "projects", feature: "projects", action: "create" },
    priority: 60,
  },
  {
    id: "sc-taxes",
    label: "Configure Taxes",
    href: "/app/organisation/taxes",
    moduleKey: "organisation",
    permission: { module: "organisation", feature: "taxes", action: "read" },
    priority: 70,
  },
];
