import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = join(root, "src/app/(dashboard)/app");

const pages = [
  ["organisation/divisions", "Divisions"],
  ["organisation/designations", "Designations"],
  ["organisation/users", "Users"],
  ["organisation/taxes", "Taxes"],
  ["setup/business-type", "Business Type"],
  ["hr/employees", "Employee Management"],
  ["hr/attendance", "Attendance & Leave"],
  ["hr/performance", "Performance & Recruitment", "scope"],
  ["finance/accounting", "Accounting"],
  ["finance/invoicing", "Invoicing"],
  ["finance/budgeting", "Budgeting"],
  ["finance/expenses", "Expenses"],
  ["finance/tax-management", "Tax Management"],
  ["finance/services/pricing", "Pricing Rules"],
  ["finance/services/packages", "Service Packages"],
  ["finance/services/sla", "SLA & Policies"],
  ["sales/leads", "Lead Management"],
  ["sales/orders", "Orders & Invoices"],
  ["sales/customers", "Customer Management"],
  ["sales/targets", "Targets & Quotas"],
  ["sales/api-forms", "API & Forms"],
  ["marketing/campaigns", "Campaigns"],
  ["marketing/email", "Email Marketing"],
  ["marketing/seo", "SEO & Analytics"],
  ["projects/bucket", "Project Bucket"],
  ["projects/tasks", "Task Tracking"],
  ["projects/milestones", "Milestones"],
  ["projects/resources", "Resource Allocation"],
  ["projects/timesheets", "Timesheets"],
  ["projects/risk", "Risk Management"],
  ["operations/tasks", "Task Management"],
  ["operations/projects", "Projects"],
  ["operations/maintenance", "Maintenance"],
  ["settings", "Settings"],
];

const template = (title, moduleStatus) => `"use client";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function Page() {
  return <ModulePlaceholder title="${title}" status="${moduleStatus}" />;
}
`;

for (const [path, title, moduleStatus = "pending"] of pages) {
  const dir = join(base, path);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "page.tsx"), template(title, moduleStatus));
}

console.log(`Created ${pages.length} placeholder pages`);
