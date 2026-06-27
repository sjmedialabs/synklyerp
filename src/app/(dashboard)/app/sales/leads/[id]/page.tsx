"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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
    <div className="space-y-6">
      <Link href="/app/sales/leads" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
        <ArrowLeft size={14} /> Back to leads
      </Link>

      <PageHeader
        title={lead.name}
        description={[lead.company, lead.email, lead.phone].filter(Boolean).join(" · ") || "Lead details"}
        badge={
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
            {lead.status.replace(/_/g, " ")}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">Source & attribution</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Original source</dt>
              <dd className="font-medium">{lead.originalSource ?? lead.source ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Lead score</dt>
              <dd className="font-medium">{lead.leadScore}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Captured from</dt>
              <dd className="font-medium">{attribution?.capturedFrom ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Campaign</dt>
              <dd className="font-medium">{attribution?.campaign ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">UTM source</dt>
              <dd className="font-medium">{attribution?.utmSource ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">UTM medium</dt>
              <dd className="font-medium">{attribution?.utmMedium ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">UTM campaign</dt>
              <dd className="font-medium">{attribution?.utmCampaign ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Landing page</dt>
              <dd className="font-medium truncate">{attribution?.landingPage ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Country / City</dt>
              <dd className="font-medium">
                {[attribution?.country, attribution?.city].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Device / Browser</dt>
              <dd className="font-medium">
                {[attribution?.device, attribution?.browser].filter(Boolean).join(" · ") || "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">Lead timeline</h2>
          {activities.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No activity recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {activities.map((a) => (
                <li key={a.id} className="border-l-2 border-indigo-200 pl-3 dark:border-indigo-900">
                  <p className="text-sm font-medium">{a.title}</p>
                  {a.description && <p className="text-xs text-slate-500">{a.description}</p>}
                  <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {lead.notes && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">Notes</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{lead.notes}</p>
        </section>
      )}
    </div>
  );
}
