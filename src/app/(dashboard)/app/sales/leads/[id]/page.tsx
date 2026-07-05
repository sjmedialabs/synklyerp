"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LeadDetailEditor } from "@/components/sales/leads/lead-detail-editor";
import { useLeadDetail } from "@/hooks/sales/crm";

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  const { data, isLoading, error } = useLeadDetail(leadId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading lead...
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-rose-600">{(error as Error)?.message ?? "Lead not found"}</p>;
  }

  const { lead, attribution, activities } = data;

  return (
    <div className="min-w-0 space-y-4">
      <Link href="/app/sales/leads" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
        <ArrowLeft size={14} /> Back to leads
      </Link>

      <LeadDetailEditor lead={lead} activities={activities} />

      {(lead.originalSource || lead.source || attribution) && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Source & attribution</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-slate-500">Original source</dt>
              <dd className="font-medium text-slate-900">{lead.originalSource ?? lead.source ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Lead score</dt>
              <dd className="font-medium text-slate-900">{lead.leadScore}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Campaign</dt>
              <dd className="font-medium text-slate-900">{attribution?.campaign ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">UTM source</dt>
              <dd className="font-medium text-slate-900">{attribution?.utmSource ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Landing page</dt>
              <dd className="truncate font-medium text-slate-900">{attribution?.landingPage ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Location</dt>
              <dd className="font-medium text-slate-900">
                {[attribution?.country, attribution?.city].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
