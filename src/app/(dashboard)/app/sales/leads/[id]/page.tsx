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

      <LeadDetailEditor lead={lead} attribution={attribution} activities={activities} />
    </div>
  );
}
