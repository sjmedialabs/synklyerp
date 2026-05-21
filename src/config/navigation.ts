import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Users,
  Receipt,
  Briefcase,
  Megaphone,
  FolderKanban,
  Settings,
  Wrench,
  LayoutDashboard,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  children?: NavItem[];
  badge?: string;
  status?: "built" | "scope" | "pending";
};

export const APP_NAVIGATION: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/app",
    status: "built",
  },
  {
    id: "setup",
    label: "Setup",
    icon: Building2,
    children: [
      { id: "organisation-hub", label: "Organisation Setup", href: "/app/setup/organisation", status: "built" },
      { id: "business-type", label: "Business Type", href: "/app/setup/business-type", status: "built" },
      { id: "company-info", label: "Company Information", href: "/app/setup/organisation/company-information", status: "built" },
      { id: "branch-mgmt", label: "Branch Management", href: "/app/setup/organisation/branches", status: "built" },
      {
        id: "organisation",
        label: "Organisation Directory",
        children: [
          { id: "taxes", label: "Taxes", href: "/app/organisation/taxes", status: "built" },
          { id: "branches", label: "Branches", href: "/app/organisation/branches", status: "built" },
          { id: "divisions", label: "Divisions", href: "/app/organisation/divisions", status: "built" },
          { id: "designations", label: "Designations", href: "/app/organisation/designations", status: "built" },
          { id: "users", label: "Users", href: "/app/organisation/users", status: "built" },
        ],
      },
    ],
  },
  {
    id: "hr",
    label: "Human Resource",
    icon: Users,
    children: [
      { id: "employees", label: "Employee Management", href: "/app/hr/employees", status: "built" },
      { id: "attendance", label: "Attendance & Leave", href: "/app/hr/attendance", status: "built" },
      { id: "payroll", label: "Payroll & Compensation", href: "/app/hr/payroll", status: "built" },
      { id: "performance", label: "Performance & Recruitment", href: "/app/hr/performance", status: "scope" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: Receipt,
    children: [
      { id: "accounting", label: "Accounting", href: "/app/finance/accounting", status: "pending" },
      { id: "invoicing", label: "Invoicing", href: "/app/finance/invoicing", status: "pending" },
      { id: "budgeting", label: "Budgeting", href: "/app/finance/budgeting", status: "pending" },
      { id: "expenses", label: "Expenses", href: "/app/finance/expenses", status: "pending" },
      { id: "tax-mgmt", label: "Tax Management", href: "/app/finance/tax-management", status: "pending" },
      {
        id: "services-hub",
        label: "Services Hub",
        status: "built",
        children: [
          { id: "service-catalog", label: "Service Catalog", href: "/app/finance/services", status: "built" },
          { id: "pricing-rules", label: "Pricing Rules", href: "/app/finance/services/pricing", status: "built" },
          { id: "packages", label: "Service Packages", href: "/app/finance/services/packages", status: "built" },
          { id: "sla", label: "SLA & Policies", href: "/app/finance/services/sla", status: "built" },
        ],
      },
    ],
  },
  {
    id: "sales",
    label: "Sales & CRM",
    icon: Briefcase,
    children: [
      { id: "leads", label: "Lead Management", href: "/app/sales/leads", status: "built" },
      { id: "orders", label: "Orders & Invoices", href: "/app/sales/orders", status: "pending" },
      { id: "customers", label: "Customer Management", href: "/app/sales/customers", status: "pending" },
      { id: "targets", label: "Targets & Quotas", href: "/app/sales/targets", status: "pending" },
      { id: "api-forms", label: "API & Forms", href: "/app/sales/api-forms", status: "pending" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    children: [
      { id: "campaigns", label: "Campaigns", href: "/app/marketing/campaigns", status: "pending" },
      { id: "email", label: "Email Marketing", href: "/app/marketing/email", status: "pending" },
      { id: "seo", label: "SEO & Analytics", href: "/app/marketing/seo", status: "pending" },
    ],
  },
  {
    id: "projects",
    label: "Project Management",
    icon: FolderKanban,
    children: [
      { id: "bucket", label: "Project Bucket", href: "/app/projects/bucket", status: "built" },
      { id: "tasks", label: "Task Tracking", href: "/app/projects/tasks", status: "pending" },
      { id: "milestones", label: "Milestones", href: "/app/projects/milestones", status: "pending" },
      { id: "resources", label: "Resource Allocation", href: "/app/projects/resources", status: "pending" },
      { id: "timesheets", label: "Timesheets", href: "/app/projects/timesheets", status: "pending" },
      { id: "risk", label: "Risk Management", href: "/app/projects/risk", status: "pending" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Wrench,
    children: [
      { id: "op-task", label: "Task Management", href: "/app/operations/tasks", status: "pending" },
      { id: "op-proj", label: "Projects", href: "/app/operations/projects", status: "pending" },
      { id: "op-maint", label: "Maintenance", href: "/app/operations/maintenance", status: "pending" },
    ],
  },
];

export const ACCOUNT_NAV: NavItem = {
  id: "account",
  label: "Account",
  icon: Settings,
  children: [{ id: "settings", label: "Settings", href: "/app/settings", status: "built" as const }],
};
