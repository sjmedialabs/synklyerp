"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";

type ReportSummary = {
  totalLeads: number;
  apiRequests: number;
  apiErrors: number;
  formViews: number;
  formSubmissions: number;
  conversionRate: number;
  leadSources: { name: string; total_leads: number; health_status: string }[];
  forms: { name: string; view_count: number; submission_count: number; spam_count: number }[];
};

export default function CrmReportsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["crm", "reports"],
    queryFn: async () => {
      const res = await fetch("/api/sales/capture/reports");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as ReportSummary;
    },
  });

  if (isLoading) {
    return <div className="flex gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading reports...</div>;
  }

  if (error || !data) {
    return <p className="text-sm text-rose-600">{(error as Error)?.message ?? "Failed to load reports"}</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="CRM Reports" description="Lead sources, API usage, form analytics, and conversion metrics." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total leads", value: data.totalLeads },
          { label: "API requests", value: data.apiRequests },
          { label: "API errors", value: data.apiErrors },
          { label: "Form conversion", value: `${data.conversionRate}%` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">Lead sources</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.leadSources.map((s) => (
              <li key={s.name} className="flex justify-between">
                <span>{s.name}</span>
                <span className="text-slate-500">{s.total_leads} leads · {s.health_status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">Form analytics</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.forms.map((f) => (
              <li key={f.name} className="flex justify-between">
                <span>{f.name}</span>
                <span className="text-slate-500">{f.view_count} views · {f.submission_count} submissions</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="text-sm">
        <Link href="/app/sales/leads" className="text-indigo-600 hover:underline">View all leads →</Link>
      </p>
    </div>
  );
}
