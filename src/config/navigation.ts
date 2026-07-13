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
      { id: "business-type", label: "Business Type", href: "/app/setup/business-type", status: "built" },
      { id: "company-info", label: "Company Information", href: "/app/setup/organisation/company-information", status: "built" },
      { id: "branch-mgmt", label: "Branch Management", href: "/app/setup/organisation/branches", status: "built" },
      { id: "whatsapp-api", label: "WhatsApp Business API", href: "/app/setup/organisation/whatsapp", status: "built" },
      { id: "dograh-ai", label: "Dograh AI Voice", href: "/app/setup/organisation/dograh", status: "built" },
      { id: "branches", label: "Branches", href: "/app/organisation/branches", status: "built" },
      { id: "divisions", label: "Divisions", href: "/app/organisation/divisions", status: "built" },
      { id: "designations", label: "Designations", href: "/app/organisation/designations", status: "built" },
      { id: "users", label: "Users", href: "/app/organisation/users", status: "built" },
      { id: "taxes", label: "Taxes", href: "/app/organisation/taxes", status: "built" },
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
      { id: "finance-dashboard", label: "Dashboard", href: "/app/finance/dashboard", status: "built" },
      { id: "finance-masters", label: "Masters", href: "/app/finance/masters/chart-of-accounts", status: "scope" },
      { id: "finance-transactions", label: "Transactions", href: "/app/finance/transactions/journal-entry", status: "scope" },
      { id: "finance-reports-analytics", label: "Reports & Analytics", href: "/app/finance/reports-analytics/balance-sheet", status: "scope" },
    ],
  },
  {
    id: "sales",
    label: "Sales & CRM",
    icon: Briefcase,
    children: [
      { id: "leads", label: "Lead Management", href: "/app/sales/leads", status: "built" },
      { id: "contact-history", label: "Contact History", href: "/app/sales/leads/communication-history", status: "built" },
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
