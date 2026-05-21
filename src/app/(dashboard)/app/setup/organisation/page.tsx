"use client";

import Link from "next/link";
import { Building2, GitBranch, FileText, ChevronRight, Shuffle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

const SETUP_MODULES = [
  {
    title: "Business Type",
    description: "Product, service, or hybrid model with subcategories, module preview, and provisioning status.",
    href: "/app/setup/business-type",
    icon: Shuffle,
  },
  {
    title: "Company Information",
    description: "Legal identity, tax registration, branding, banking, and compliance-ready master data.",
    href: "/app/setup/organisation/company-information",
    icon: FileText,
  },
  {
    title: "Branch Management",
    description: "Create branches, assign modules, and control operational visibility per location.",
    href: "/app/setup/organisation/branches",
    icon: GitBranch,
  },
  {
    title: "Organisation Directory",
    description: "Taxes, divisions, designations, users, and classic organisation records.",
    href: "/app/organisation/taxes",
    icon: Building2,
  },
];

export default function OrganisationSetupHubPage() {
  return (
    <div>
      <PageHeader
        title="Organisation Setup"
        description="Configure your company profile, branches, and organisation structure."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SETUP_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Icon size={20} />
              </div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{mod.title}</h2>
              <p className="mt-2 flex-1 text-sm text-slate-500">{mod.description}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 group-hover:underline dark:text-indigo-300">
                Open module <ChevronRight size={16} className="ml-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
