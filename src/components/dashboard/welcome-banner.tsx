"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LayoutDashboard } from "lucide-react";

type WelcomeBannerProps = {
  tenantName: string | null;
  businessType: string;
  kpiCount: number;
  moduleCount: number;
};

export function WelcomeBanner({ tenantName, businessType, kpiCount, moduleCount }: WelcomeBannerProps) {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-5 dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <LayoutDashboard size={14} />
            {tenantName ?? "Your workspace"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            Good day, {firstName}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {businessType}-based ERP · {moduleCount} active modules · {kpiCount} metrics on your dashboard
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/app/setup/business-type"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Business profile
          </Link>
          <Link
            href="/app/settings"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
