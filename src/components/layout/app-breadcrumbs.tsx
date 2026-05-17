"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  app: "Home",
  organisation: "Organisation",
  branches: "Branches",
  divisions: "Divisions",
  designations: "Designations",
  users: "Users",
  taxes: "Taxes",
  hr: "Human Resources",
  employees: "Employees",
  attendance: "Attendance",
  payroll: "Payroll",
  performance: "Performance",
  finance: "Finance",
  services: "Services Hub",
  pricing: "Pricing Rules",
  packages: "Packages",
  sla: "SLA",
  sales: "Sales",
  leads: "Leads",
  projects: "Projects",
  bucket: "Project Bucket",
  marketing: "Marketing",
  operations: "Operations",
  setup: "Setup",
  settings: "Settings",
};

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => ({
    href: "/" + segments.slice(0, i + 1).join("/"),
    label: LABELS[seg] ?? seg.replace(/-/g, " "),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
      <Link href="/app" className="flex items-center hover:text-indigo-600">
        <Home size={14} />
      </Link>
      {crumbs.slice(1).map((c) => (
        <span key={c.href} className="flex items-center gap-1">
          <ChevronRight size={14} className="opacity-50" />
          {c.isLast ? (
            <span className="font-medium capitalize text-slate-900 dark:text-white">{c.label}</span>
          ) : (
            <Link href={c.href} className="capitalize hover:text-indigo-600">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
