"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, Target } from "lucide-react";
import { statusBadgeClass, statusLabel } from "@/lib/sales/lead-stages";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/mappers/modules";

type DashboardData = {
  leads: Lead[];
  followups: { id: string; leadId: string; dueAt: string; reason: string | null; lead: { name: string; company: string | null } | null }[];
};

export function AssignedLeadsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["sales", "my-leads-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/sales/leads/my-dashboard");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load");
      return json.data as DashboardData;
    },
    staleTime: 30_000,
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Target className="h-[18px] w-[18px] text-indigo-600" />
        My Assigned Leads
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : !data?.leads.length ? (
        <p className="text-sm text-slate-500">No leads assigned to you yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/app/sales/leads/${lead.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span>
                  <span className="font-medium text-slate-900">{lead.name}</span>
                  {lead.company && <span className="text-slate-500"> · {lead.company}</span>}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusBadgeClass(lead.status))}>
                  {statusLabel(lead.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data?.followups && data.followups.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <AlertCircle size={14} /> Follow-up required
          </p>
          <ul className="space-y-2 text-sm">
            {data.followups.map((f) => (
              <li key={f.id}>
                <Link href={`/app/sales/leads/${f.leadId}`} className="text-indigo-600 hover:underline">
                  {f.lead?.name ?? "Lead"} — {f.reason ?? "Follow up"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
