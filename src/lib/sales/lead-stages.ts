import { LEAD_STATUSES } from "@/constants/roles";

export type LeadStageTab = "all" | "fresh" | "prospects" | "converted" | "dropped";

export const PROSPECT_STATUSES = ["PROSPECT", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION"] as const;

export const LEAD_STAGE_TABS: { id: LeadStageTab; label: string }[] = [
  { id: "all", label: "All Leads" },
  { id: "fresh", label: "Fresh Leads" },
  { id: "prospects", label: "Prospects" },
  { id: "converted", label: "Converted" },
  { id: "dropped", label: "Dropped" },
];

export const PIPELINE_STEPS = [
  { key: "FRESH_LEAD", label: "Inquiry" },
  { key: "PROSPECT", label: "Discussion" },
  { key: "PROPOSAL_SENT", label: "Proposal" },
  { key: "NEGOTIATION", label: "Negotiation" },
  { key: "CONVERTED", label: "Won" },
] as const;

/** Progress stages shown on the lead detail view (matches CRM mockup). */
export const DETAIL_PROGRESS_STEPS = [
  { key: "FRESH_LEAD", label: "Follow Up", shortLabel: "Follow Up" },
  { key: "PROSPECT", label: "In Discussion", shortLabel: "In Discussion" },
  { key: "PROPOSAL_SENT", label: "Quote Submitted", shortLabel: "Quote Submitted" },
  { key: "NEGOTIATION", label: "Negotiation", shortLabel: "Negotiation" },
] as const;

/** Status options for the lead detail dropdown (mockup labels + dot colours). */
export const LEAD_VIEW_STATUSES = [
  { value: "FRESH_LEAD", label: "FRESH LEAD", dot: "bg-blue-500" },
  { value: "PROSPECT", label: "IN DISCUSSION", dot: "bg-amber-500" },
  { value: "PROPOSAL_SENT", label: "QUOTE SUBMITTED", dot: "bg-teal-500" },
  { value: "NEGOTIATION", label: "NEGOTIATION", dot: "bg-violet-500" },
  { value: "CONVERTED", label: "WON", dot: "bg-emerald-500" },
  { value: "DROPPED", label: "LOST", dot: "bg-rose-500" },
  { value: "QUALIFIED", label: "QUALIFIED", dot: "bg-sky-500" },
] as const;

export function viewStatusOption(status: string) {
  return LEAD_VIEW_STATUSES.find((s) => s.value === status) ?? {
    value: status,
    label: statusLabel(status),
    dot: "bg-slate-400",
  };
}

export function detailProgressLabel(status: string) {
  const step = DETAIL_PROGRESS_STEPS.find((s) => s.key === status);
  if (step) return step.label;
  if (status === "QUALIFIED") return "In Discussion";
  if (status === "CONVERTED") return "Won";
  if (status === "DROPPED") return "Dropped";
  return statusLabel(status);
}

export function leadAgeDays(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export type DashboardCounts = {
  all: number;
  fresh: number;
  prospects: number;
  converted: number;
  dropped: number;
};

export function aggregateDashboardCounts(byStatus: Record<string, number>): DashboardCounts {
  let fresh = 0;
  let prospects = 0;
  let converted = 0;
  let dropped = 0;

  for (const [status, count] of Object.entries(byStatus)) {
    if (status === "FRESH_LEAD") fresh += count;
    else if ((PROSPECT_STATUSES as readonly string[]).includes(status)) prospects += count;
    else if (status === "CONVERTED") converted += count;
    else if (status === "DROPPED") dropped += count;
  }

  const all = fresh + prospects + converted + dropped;
  return { all, fresh, prospects, converted, dropped };
}

export function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function statusBadgeClass(status: string) {
  if (status === "FRESH_LEAD") return "bg-emerald-100 text-emerald-700";
  if ((PROSPECT_STATUSES as readonly string[]).includes(status))
    return "bg-blue-100 text-blue-700";
  if (status === "CONVERTED") return "bg-indigo-100 text-indigo-700";
  if (status === "DROPPED") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

const LEAD_TYPE_COLORS: Record<string, string> = {
  INBOUND: "bg-violet-100 text-violet-700",
  OUTBOUND: "bg-cyan-100 text-cyan-700",
  WEBSITE: "bg-sky-100 text-sky-700",
  REFERRAL: "bg-amber-100 text-amber-700",
  FACEBOOK: "bg-blue-100 text-blue-700",
  GOOGLE: "bg-red-100 text-red-700",
  LINKEDIN: "bg-indigo-100 text-indigo-700",
  CAMPAIGN: "bg-fuchsia-100 text-fuchsia-700",
};

export function leadTypeBadgeClass(type: string) {
  const key = type.toUpperCase().replace(/\s+/g, "_");
  return LEAD_TYPE_COLORS[key] ?? "bg-slate-100 text-slate-700";
}

export function pipelineIndex(status: string) {
  const order = [...LEAD_STATUSES];
  const idx = order.indexOf(status as (typeof LEAD_STATUSES)[number]);
  return idx >= 0 ? idx : 0;
}

export function progressPercent(status: string, progress: number) {
  if (progress > 0) return Math.min(100, progress);
  if (status === "CONVERTED") return 100;
  if (status === "DROPPED") return 0;
  const max = LEAD_STATUSES.length - 1;
  return Math.round((pipelineIndex(status) / max) * 100);
}
