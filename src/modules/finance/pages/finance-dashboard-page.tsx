"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  ChevronRight,
  Clock3,
  Landmark,
  Loader2,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useFinanceDashboard } from "@/hooks/finance";
import { resolveSidebarIcon } from "@/lib/sidebar/icon-map";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTrend(value: number | null) {
  if (value == null) return null;
  const positive = value >= 0;
  return {
    label: `${positive ? "+" : ""}${value}% vs Last Month`,
    positive,
  };
}

function formatActivityTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const KPI_CONFIG = [
  {
    key: "totalReceivables" as const,
    trendKey: "receivablesTrendPct" as const,
    label: "Total Receivables",
    icon: TrendingUp,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "totalPayables" as const,
    trendKey: "payablesTrendPct" as const,
    label: "Total Payables",
    icon: Receipt,
    iconClass: "bg-orange-50 text-orange-600",
  },
  {
    key: "cashBankBalance" as const,
    trendKey: "cashTrendPct" as const,
    label: "Cash & Bank Balance",
    icon: Landmark,
    iconClass: "bg-slate-900 text-white",
  },
  {
    key: "totalIncomeMtd" as const,
    trendKey: "incomeTrendPct" as const,
    label: "Total Income (MTD)",
    icon: Wallet,
    iconClass: "bg-cyan-50 text-cyan-600",
  },
  {
    key: "totalExpenseMtd" as const,
    trendKey: "expenseTrendPct" as const,
    label: "Total Expense (MTD)",
    icon: Banknote,
    iconClass: "bg-rose-50 text-rose-600",
  },
];

export default function FinanceDashboardPage() {
  const { data, isLoading, error } = useFinanceDashboard();

  const stats = data?.stats;
  const modules = data?.modules ?? [];
  const reports = data?.reports ?? [];
  const activities = data?.activities ?? [];

  const statCards = useMemo(
    () =>
      KPI_CONFIG.map((item) => ({
        ...item,
        value: stats ? stats[item.key] : 0,
        trend: stats ? formatTrend(stats[item.trendKey]) : null,
      })),
    [stats]
  );

  return (
    <div>
      <PageHeader
        title="Finance Dashboard"
        description="Overview of receivables, payables, cash position, and finance module access."
      />

      {isLoading && (
        <div className="mb-6 flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}
      {error && <p className="mb-4 text-sm text-rose-600">{(error as Error).message}</p>}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map(({ label, value, trend, icon: Icon, iconClass }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(value)}
                </p>
              </div>
              <span className={cn("rounded-lg p-2", iconClass)}>
                <Icon size={18} />
              </span>
            </div>
            {trend ? (
              <p
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.positive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trend.label}
              </p>
            ) : (
              <p className="text-xs text-slate-400">No prior period data</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Finance Modules</h2>
              <span className="text-sm text-slate-500">{modules.length} modules</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => {
                const Icon = resolveSidebarIcon(module.icon, module.slug);
                const href = module.path ?? module.firstChildPath;
                const CardInner = (
                  <>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span className="rounded-lg bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Icon size={18} />
                      </span>
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{module.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{module.description}</p>
                    <p className="mt-2 text-xs text-slate-400">{module.childCount} submodules</p>
                  </>
                );

                if (!href) {
                  return (
                    <div
                      key={module.slug}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      {CardInner}
                    </div>
                  );
                }

                return (
                  <Link
                    key={module.slug}
                    href={href}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:border-indigo-900/50 dark:hover:bg-indigo-950/20"
                  >
                    {CardInner}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activities</h2>
              <Clock3 size={16} className="text-slate-400" />
            </div>
            {activities.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
                No finance activities recorded yet. Activities appear when journals, invoices, or payments are posted.
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{activity.title}</p>
                        {activity.referenceNo && (
                          <p className="text-xs text-indigo-600">{activity.referenceNo}</p>
                        )}
                        {activity.description && (
                          <p className="mt-1 text-sm text-slate-500">{activity.description}</p>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{formatActivityTime(activity.occurredAt)}</p>
                    </div>
                    {activity.actorName && (
                      <p className="mt-1 text-xs text-slate-500">By {activity.actorName}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Reports & Analytics</h2>
              <BarChart3 size={16} className="text-slate-400" />
            </div>
            <div className="space-y-2">
              {reports.map((report) => {
                const Icon = resolveSidebarIcon(report.icon, report.slug);
                return (
                  <Link
                    key={report.slug}
                    href={report.path}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 px-3 py-2.5 transition hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:border-indigo-900/50 dark:hover:bg-indigo-950/20"
                  >
                    <span className="mt-0.5 rounded-md bg-slate-100 p-1.5 text-slate-600 dark:bg-slate-800">
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900 dark:text-white">
                        {report.name}
                      </span>
                      <span className="block text-xs text-slate-500">{report.description}</span>
                    </span>
                    <ChevronRight size={14} className="mt-1 shrink-0 text-slate-400" />
                  </Link>
                );
              })}
            </div>
            <Link
              href="/app/finance/reports-analytics/custom-reports"
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus size={14} /> Create Custom Report
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
