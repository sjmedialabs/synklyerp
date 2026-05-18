"use client";

import { Construction, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageHeader } from "./page-header";
import type { ErpModuleKey } from "@/constants/onboarding";

type ModulePlaceholderProps = {
  title: string;
  description?: string;
  status?: "pending" | "scope" | "phase";
  phase?: number;
  features?: string[];
  builtModules?: { label: string; href: string }[];
};

export function ModulePlaceholder({
  title,
  description,
  status = "pending",
  phase = 5,
  features = [],
  builtModules,
}: ModulePlaceholderProps) {
  const { data: session } = useSession();
  const enabled = new Set(session?.user?.enabledModules ?? []);

  const defaultBuiltModules = [
    { label: "Branches", href: "/app/organisation/branches", module: null as ErpModuleKey | null },
    { label: "Employees", href: "/app/hr/employees", module: "HR" as const },
    { label: "Payroll", href: "/app/hr/payroll", module: "HR" as const },
    { label: "Service Catalog", href: "/app/finance/services", module: "Finance" as const },
    { label: "Leads", href: "/app/sales/leads", module: "Sales" as const },
    { label: "Projects", href: "/app/projects/bucket", module: "Projects" as const },
  ];

  const liveModules =
    builtModules ??
    defaultBuiltModules
      .filter((m) => !m.module || enabled.has(m.module))
      .map(({ label, href }) => ({ label, href }));

  const defaultDescription =
    status === "scope"
      ? "Defined in the ERP scope document. Implementation is scheduled for a future phase."
      : `This screen is on the Phase ${phase} roadmap. Core platform services (auth, RBAC, modules, audit logs) are active.`;

  return (
    <div>
      <PageHeader
        title={title}
        description={description ?? defaultDescription}
        badge={
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            {status === "scope" ? "Scope defined" : status === "phase" ? `Phase ${phase}` : "Coming soon"}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-3">
            <Construction className="h-8 w-8 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Planned capabilities</h3>
          </div>
          {features.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Full workflows, reporting, and automation for {title} will ship in an upcoming release. No mock data is shown in production modules.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Live modules you can use now</h3>
          <ul className="space-y-2">
            {liveModules.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-600 hover:text-white dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white"
                >
                  {m.label}
                  <ArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
