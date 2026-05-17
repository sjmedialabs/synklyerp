"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, Briefcase, FolderKanban, Receipt, Activity, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) return null as T;
  return json.data as T;
}

export default function AppDashboardPage() {
  const { data: userStats, isLoading: uLoading } = useQuery({
    queryKey: ["dash-user-stats"],
    queryFn: () => getJson<{ total: number; active: number }>("/api/organisation/users/stats"),
  });
  const { data: empStats, isLoading: eLoading } = useQuery({
    queryKey: ["dash-emp-stats"],
    queryFn: () => getJson<{ total: number; active: number }>("/api/hr/employees/stats"),
  });
  const { data: leadStats } = useQuery({
    queryKey: ["dash-lead-stats"],
    queryFn: () => getJson<{ total: number }>("/api/sales/leads/stats"),
  });
  const { data: projectStats } = useQuery({
    queryKey: ["dash-project-stats"],
    queryFn: () => getJson<{ total: number }>("/api/projects/stats"),
  });
  const { data: activity = [] } = useQuery({
    queryKey: ["dash-activity"],
    queryFn: () => getJson<{ module: string; action: string; userName?: string; createdAt: string }[]>("/api/activity-logs?limit=8"),
  });

  const kpis = [
    { label: "Org Users", value: userStats?.total ?? "—", icon: Users, href: "/app/organisation/users", loading: uLoading },
    { label: "Employees", value: empStats?.total ?? "—", icon: Briefcase, href: "/app/hr/employees", loading: eLoading },
    { label: "Leads", value: leadStats?.total ?? "—", icon: Receipt, href: "/app/sales/leads", loading: false },
    { label: "Projects", value: projectStats?.total ?? "—", icon: FolderKanban, href: "/app/projects/bucket", loading: false },
  ];

  const shortcuts = [
    { label: "Add Branch", href: "/app/organisation/branches" },
    { label: "Add Employee", href: "/app/hr/employees" },
    { label: "New Lead", href: "/app/sales/leads" },
    { label: "Service Catalog", href: "/app/finance/services" },
    { label: "Taxes", href: "/app/organisation/taxes" },
    { label: "Attendance", href: "/app/hr/attendance" },
  ];

  return (
    <div>
      <PageHeader
        title="Workspace Dashboard"
        description="Overview of your organisation with live data from PostgreSQL-backed APIs."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <k.icon className="h-5 w-5 text-indigo-600" />
              {k.loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{k.value}</p>
            <p className="text-sm text-slate-500 group-hover:text-indigo-600">{k.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Activity size={18} className="text-indigo-600" /> Recent activity
          </h3>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity logs yet. Actions across modules will appear here after migration 003.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start justify-between border-b border-slate-100 pb-2 text-sm last:border-0 dark:border-slate-800">
                  <span>
                    <span className="font-medium text-slate-900 dark:text-white">{a.module}</span>
                    <span className="text-slate-500"> · {a.action}</span>
                    {a.userName && <span className="text-slate-400"> by {a.userName}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Building2 size={18} className="text-indigo-600" /> Quick actions
          </h3>
          <div className="flex flex-col gap-2">
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-indigo-900/30"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
