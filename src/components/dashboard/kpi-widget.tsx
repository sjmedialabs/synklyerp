"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { DashboardWidgetDef } from "@/config/dashboard-widgets";
import { DashboardIcon } from "@/components/dashboard/icon-map";

async function fetchStats(url: string): Promise<Record<string, number>> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) return {};
  return json.data as Record<string, number>;
}

export function KpiWidget({ widget }: { widget: DashboardWidgetDef }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "kpi", widget.id],
    queryFn: () => fetchStats(widget.apiUrl!),
    enabled: !!widget.apiUrl,
    staleTime: 30_000,
  });

  const value = widget.valueKey ? data?.[widget.valueKey] : undefined;
  const sub = widget.subKey ? data?.[widget.subKey] : undefined;

  const content = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <DashboardIcon name={widget.icon} className="h-5 w-5 text-indigo-600" />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {isError ? "—" : value ?? (isLoading ? "…" : "—")}
      </p>
      <p className="text-sm text-slate-500 group-hover:text-indigo-600">{widget.label}</p>
      {sub !== undefined && widget.subLabel && (
        <p className="mt-1 text-xs text-slate-400">
          {sub} {widget.subLabel}
        </p>
      )}
      {widget.description && (
        <p className="mt-1 text-xs text-slate-400">{widget.description}</p>
      )}
    </>
  );

  if (widget.href) {
    return (
      <Link
        href={widget.href}
        className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {content}
    </div>
  );
}
