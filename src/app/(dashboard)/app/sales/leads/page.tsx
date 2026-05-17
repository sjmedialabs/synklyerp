"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { LEAD_STATUSES } from "@/constants/roles";

type Lead = {
  id: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  leadType: string;
  status: string;
  createdAt: string;
  service?: { name: string } | null;
  assignee?: { name: string | null } | null;
};

async function fetchLeads() {
  const res = await fetch("/api/sales/leads");
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data as Lead[];
}

export default function LeadsPage() {
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  const counts = LEAD_STATUSES.reduce(
    (acc, s) => {
      acc[s] = leads.filter((l) => l.status === s).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <PageHeader
        title="Lead Management"
        description="Pipeline, assignments, and conversion tracking."
        badge={
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            {leads.length} total
          </span>
        }
        actions={
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus size={16} className="mr-2" /> New Lead
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {LEAD_STATUSES.map((status) => (
          <span
            key={status}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-900"
          >
            {status.replace(/_/g, " ")}: {counts[status] ?? 0}
          </span>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading leads...
        </div>
      )}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800">
            <tr>
              {["Date", "Company", "Contact", "Type", "Service", "Status", "Assignee"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No leads yet. Add your first lead to start the pipeline.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{lead.company ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3">{lead.leadType}</td>
                  <td className="px-4 py-3">{lead.service?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                      {lead.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">{lead.assignee?.name ?? "Unassigned"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
