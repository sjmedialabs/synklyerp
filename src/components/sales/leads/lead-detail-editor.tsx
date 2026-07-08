"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  Check,
  Clock,
  FileText,
  Handshake,
  Loader2,
  Mail,
  MessageSquare,
  Network,
  Phone,
  Pin,
  Save,
  Send,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { LEAD_STATUSES } from "@/constants/roles";
import { AccountManagerSelect } from "@/components/sales/leads/account-manager-select";
import { LeadCommunicationActions } from "@/components/sales/leads/lead-communication-actions";
import { LeadStatusSelect } from "@/components/sales/leads/lead-status-select";
import { StickyOnScrollPanel } from "@/components/sales/leads/sticky-on-scroll-panel";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useServices } from "@/hooks/modules";
import { useAddLeadNote, useLeadMutations } from "@/hooks/sales/crm";
import type { CrmLeadActivity, CrmLeadAttribution } from "@/lib/mappers/crm";
import type { Lead } from "@/lib/mappers/modules";
import {
  DETAIL_PROGRESS_STEPS,
  detailProgressLabel,
  leadAgeDays,
  leadTypeBadgeClass,
  progressPercent,
  statusBadgeClass,
  statusLabel,
  viewStatusOption,
} from "@/lib/sales/lead-stages";
import { cn } from "@/lib/utils";

const LEAD_TYPES = ["INBOUND", "OUTBOUND", "WEBSITE", "REFERRAL", "FACEBOOK", "GOOGLE", "LINKEDIN", "CAMPAIGN"] as const;
const PRIORITIES = ["Low", "Medium", "High"] as const;

const PROGRESS_ICONS = {
  FRESH_LEAD: Phone,
  PROSPECT: MessageSquare,
  PROPOSAL_SENT: FileText,
  NEGOTIATION: Handshake,
} as const;

type FormState = {
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  budget: string;
  projectInterest: string;
  leadType: string;
  status: string;
  progress: number;
  assignedTo: string | null;
  serviceId: string;
  priority: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toFormState(lead: Lead): FormState {
  return {
    name: lead.name,
    company: lead.company ?? "",
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    city: lead.city ?? "",
    budget: lead.budget ?? "",
    projectInterest: lead.projectInterest ?? "",
    leadType: lead.leadType,
    status: lead.status,
    progress: progressPercent(lead.status, lead.progress),
    assignedTo: lead.assignedTo,
    serviceId: lead.serviceId ?? "",
    priority: "Medium",
  };
}

function Card({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
        {Icon && <Icon size={15} className="text-indigo-600" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  compact,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <Icon size={13} className="shrink-0 text-slate-400" />
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase leading-none tracking-wide text-slate-400">{label}</p>
          <p className="text-xs font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
        <Icon size={16} className="text-slate-500" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function CommentsActivityBody({
  noteDraft,
  setNoteDraft,
  submitNote,
  addNotePending,
  activities,
  scrollableTimeline,
}: {
  noteDraft: string;
  setNoteDraft: (v: string) => void;
  submitNote: () => void;
  addNotePending: boolean;
  activities: CrmLeadActivity[];
  scrollableTimeline?: boolean;
}) {
  return (
    <>
      <div>
        <Label className="text-xs text-slate-500">Add a note</Label>
        <Textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          rows={4}
          placeholder="Type your note here..."
          className="mt-1.5"
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={!noteDraft.trim() || addNotePending}
            onClick={submitNote}
          >
            {addNotePending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Send size={14} className="mr-1.5" />}
            Add Note
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 border-t border-slate-100 pt-4",
          scrollableTimeline && "max-h-[calc(100vh-14rem)] overflow-y-auto"
        )}
      >
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500">No activity recorded yet.</p>
        ) : (
          <ul className="relative space-y-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-slate-200">
            {activities.map((a) => (
              <li key={a.id} className="relative flex gap-3 pl-7">
                <span className="absolute left-0 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-indigo-100">
                  <MessageSquare size={11} className="text-indigo-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                  {a.description && <p className="mt-0.5 text-xs text-slate-600">{a.description}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

type Props = {
  lead: Lead;
  attribution: CrmLeadAttribution | null;
  activities: CrmLeadActivity[];
};

export function LeadDetailEditor({ lead, attribution, activities }: Props) {
  const { update } = useLeadMutations();
  const addNote = useAddLeadNote(lead.id);
  const { data: services = [] } = useServices();
  const [form, setForm] = useState<FormState>(() => toFormState(lead));
  const [dirty, setDirty] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    setForm(toFormState(lead));
    setDirty(false);
  }, [lead]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleStatusChange = (status: string) => {
    setForm((prev) => ({
      ...prev,
      status,
      progress: progressPercent(status, 0),
    }));
    setDirty(true);
  };

  const selectProgressStage = (status: string) => {
    setForm((prev) => ({
      ...prev,
      status,
      progress: progressPercent(status, 0),
    }));
    setDirty(true);
  };

  const save = async () => {
    try {
      await update.mutateAsync({
        id: lead.id,
        name: form.name,
        company: form.company || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        city: form.city || undefined,
        budget: form.budget || undefined,
        projectInterest: form.projectInterest || undefined,
        leadType: form.leadType,
        status: form.status,
        progress: form.progress,
        assignedTo: form.assignedTo ?? "",
        serviceId: form.serviceId || undefined,
      });
      toast.success("Lead updated");
      setDirty(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const submitNote = async () => {
    const text = noteDraft.trim();
    if (!text) return;
    try {
      await addNote.mutateAsync(text);
      setNoteDraft("");
      toast.success("Note added");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const pct = form.progress;
  const ageDays = leadAgeDays(lead.createdAt);
  const progressTag = detailProgressLabel(form.status);
  const statusOpt = viewStatusOption(form.status);
  const assigneeDisplay = form.assignedTo === lead.assignedTo ? (lead.assignee?.name ?? "Unassigned") : form.assignedTo ? "Assigned" : "Unassigned";

  let activeProgressIdx = DETAIL_PROGRESS_STEPS.findIndex((s) => s.key === form.status);
  if (activeProgressIdx < 0 && form.status === "QUALIFIED") activeProgressIdx = 1;

  return (
    <div className="space-y-4">
      {/* Compact header — single row */}
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:flex-nowrap lg:gap-3">
          {/* Avatar + identity */}
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              {initials(form.name || "?")}
            </div>
            <div className="min-w-0">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="h-auto border-0 bg-transparent p-0 text-base font-bold leading-tight shadow-none focus-visible:ring-0"
                aria-label="Contact name"
              />
              <Input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Company name"
                className="h-auto border-0 bg-transparent p-0 text-xs text-slate-500 shadow-none focus-visible:ring-0"
                aria-label="Company"
              />
              <div className="mt-1 flex flex-wrap gap-1">
                <span className={cn("rounded-full px-1.5 py-px text-[10px] font-semibold uppercase", statusBadgeClass(form.status))}>
                  {statusLabel(form.status)}
                </span>
                <span className="rounded-full bg-violet-100 px-1.5 py-px text-[10px] font-semibold text-violet-700">{progressTag}</span>
                <span className={cn("rounded-full px-1.5 py-px text-[10px] font-semibold uppercase", leadTypeBadgeClass(form.leadType))}>
                  {form.leadType.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden h-9 w-px shrink-0 bg-slate-200 lg:block" />

          {/* Stats */}
          <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 lg:gap-x-5">
            <StatItem compact icon={Clock} label="Lead Age" value={`${ageDays} days`} />
            <StatItem compact icon={Star} label="Lead Score" value={String(lead.leadScore)} />
            <StatItem compact icon={Calendar} label="Lead Date" value={new Date(lead.createdAt).toLocaleDateString()} />
            <StatItem compact icon={User} label="Assigned To" value={assigneeDisplay} />
          </div>

          {/* Status + save */}
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            <LeadStatusSelect compact value={form.status} onChange={handleStatusChange} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 border-indigo-200 px-2.5 text-xs text-indigo-700 hover:bg-indigo-50"
              disabled={!dirty || update.isPending}
              onClick={save}
            >
              {update.isPending ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Save size={13} className="mr-1" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* 2-column body: left content + sticky right panel */}
      <div className="grid items-start gap-4 lg:grid-cols-12">
        {/* Left — ~65% */}
        <div className="space-y-4 lg:col-span-8">
          <Card title="Lead Progress" icon={Pin}>
            <div className="flex items-stretch gap-1 sm:gap-2">
              {DETAIL_PROGRESS_STEPS.map((step, i) => {
                const Icon = PROGRESS_ICONS[step.key as keyof typeof PROGRESS_ICONS];
                const completed = activeProgressIdx >= 0 && i < activeProgressIdx;
                const active = activeProgressIdx === i || (form.status === "QUALIFIED" && step.key === "PROSPECT");
                return (
                  <div key={step.key} className="flex flex-1 items-stretch">
                    <button
                      type="button"
                      onClick={() => selectProgressStage(step.key)}
                      className={cn(
                        "relative flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-1 py-3 text-center transition-all sm:px-2",
                        active
                          ? "border-indigo-500 bg-indigo-50 shadow-sm"
                          : completed
                            ? "border-emerald-200 bg-emerald-50/50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      {active && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500 sm:right-2 sm:top-2" />}
                      {completed ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check size={14} />
                        </span>
                      ) : (
                        <Icon size={18} className={active ? "text-indigo-600" : "text-slate-400"} />
                      )}
                      <span className={cn("text-[10px] font-medium leading-tight sm:text-xs", active ? "text-indigo-700" : "text-slate-600")}>
                        {step.label}
                      </span>
                    </button>
                    {i < DETAIL_PROGRESS_STEPS.length - 1 && (
                      <div className="mx-0.5 flex w-2 shrink-0 items-center sm:mx-1 sm:w-4">
                        <div className={cn("h-px w-full border-t border-dashed", completed ? "border-emerald-300" : "border-slate-200")} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Progress</span>
                <span className="font-bold text-indigo-600">{pct}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-indigo-600 transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={pct}
                onChange={(e) => set("progress", Number(e.target.value))}
                className="mt-3 w-full accent-indigo-600"
                aria-label="Lead progress percentage"
              />
              <div className="relative mt-4 flex justify-between">
                {DETAIL_PROGRESS_STEPS.map((step, i) => {
                  const active = activeProgressIdx === i || (form.status === "QUALIFIED" && step.key === "PROSPECT");
                  return (
                    <span
                      key={step.key}
                      className={cn(
                        "max-w-[4.5rem] truncate text-center text-[10px] font-medium sm:max-w-none sm:text-xs",
                        active ? "text-indigo-600" : "text-slate-400"
                      )}
                    >
                      {step.shortLabel}
                    </span>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">
                Current stage: <span className="font-semibold text-indigo-600">{progressTag}</span>
                <span className="text-slate-400"> · {pct}% complete</span>
              </p>
            </div>
          </Card>

          {/* Contact + Source/Quick Summary side by side */}
          <div className="grid items-start gap-4 md:grid-cols-2">
            <Card title="Contact Information" icon={User}>
            <FieldRow label="Phone">
              <div className="flex items-center gap-2">
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="flex-1"
                  placeholder="—"
                />
                {form.phone && (
                  <a
                    href={`tel:${form.phone}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    aria-label="Call"
                  >
                    <Phone size={16} />
                  </a>
                )}
              </div>
            </FieldRow>
            <FieldRow label="Email">
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="flex-1 text-indigo-600"
                  placeholder="—"
                />
                {form.email && (
                  <a
                    href={`mailto:${form.email}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    aria-label="Email"
                  >
                    <Mail size={16} />
                  </a>
                )}
              </div>
            </FieldRow>
            <FieldRow label="Service">
              <Select value={form.serviceId} onChange={(e) => set("serviceId", e.target.value)}>
                <option value="">—</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow label="Lead Type">
              <Select value={form.leadType} onChange={(e) => set("leadType", e.target.value)}>
                {LEAD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow label="Status">
              <div className="flex items-center gap-2">
                <Select value={form.status} onChange={(e) => handleStatusChange(e.target.value)} className="flex-1">
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase", statusBadgeClass(form.status))}>
                  {statusOpt.label}
                </span>
              </div>
            </FieldRow>
            <FieldRow label="Priority">
              <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {form.priority}
              </span>
            </FieldRow>
            <FieldRow label="Assigned To">
              <AccountManagerSelect
                value={form.assignedTo}
                displayLabel={lead.assignee?.name}
                onChange={(userId) => set("assignedTo", userId)}
              />
            </FieldRow>
            <FieldRow label="Tags">
              <button type="button" className="text-sm font-medium text-indigo-600 hover:underline">
                + Add Tag
              </button>
            </FieldRow>
          </Card>

            <Card title="Property Interest" icon={Pin}>
              <p className="mb-3 text-xs text-slate-500">
                Used by Dograh AI during calls for context (city, budget, preferred project).
              </p>
              <FieldRow label="City">
                <Input
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="e.g. Hyderabad"
                />
              </FieldRow>
              <FieldRow label="Budget">
                <Input
                  value={form.budget}
                  onChange={(e) => set("budget", e.target.value)}
                  placeholder="e.g. 80 Lakhs"
                />
              </FieldRow>
              <FieldRow label="Project / Property">
                <Input
                  value={form.projectInterest}
                  onChange={(e) => set("projectInterest", e.target.value)}
                  placeholder="e.g. Sky Villas"
                />
              </FieldRow>
            </Card>

            <div className="space-y-4">
              <Card title="Source & Attribution" icon={Network}>
                <dl className="space-y-3 text-sm">
                  {[
                    { label: "Original Source", value: lead.originalSource ?? lead.source ?? "—" },
                    { label: "Lead Score", value: String(lead.leadScore) },
                    { label: "Campaign", value: attribution?.campaign ?? "—" },
                    { label: "Landing Page", value: attribution?.landingPage ?? "—" },
                    { label: "UTM Source", value: attribution?.utmSource ?? "—" },
                    { label: "Location", value: [attribution?.country, attribution?.city].filter(Boolean).join(", ") || "—" },
                  ].map((row) => (
                    <div key={row.label} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card title="Quick Summary" icon={BarChart3}>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Lead Age", value: `${ageDays} days` },
                    { label: "Lead Date", value: new Date(lead.createdAt).toLocaleDateString() },
                    { label: "Assigned To", value: assigneeDisplay },
                    { label: "Last Updated", value: new Date(lead.updatedAt).toLocaleString() },
                  ].map((row) => (
                    <div key={row.label}>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </div>
          </div>
        </div>

        {/* Right — Quick Actions + Comments & Activity */}
        <div className="space-y-4 lg:col-span-4 lg:self-start">
          <LeadCommunicationActions
            leadId={lead.id}
            leadName={form.name}
            phone={form.phone}
            email={form.email}
          />

          {(lead.aiSummary || lead.lastCallAt || lead.budget || lead.projectInterest) && (
            <section className="rounded-xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-900">
                <Sparkles size={16} /> AI Call Insights
              </h2>
              {lead.aiSummary && <p className="text-sm text-violet-950">{lead.aiSummary}</p>}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-violet-900">
                {lead.budget && (
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-violet-700">Budget</dt>
                    <dd>{lead.budget}</dd>
                  </div>
                )}
                {lead.projectInterest && (
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-violet-700">Project</dt>
                    <dd>{lead.projectInterest}</dd>
                  </div>
                )}
                {lead.city && (
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-violet-700">City</dt>
                    <dd>{lead.city}</dd>
                  </div>
                )}
              </dl>
              {lead.lastCallAt && (
                <p className="mt-2 text-xs text-violet-700">
                  Last AI call: {new Date(lead.lastCallAt).toLocaleString()}
                </p>
              )}
            </section>
          )}

          <div className="lg:hidden">
            <Card title="Comments & Activity" icon={MessageSquare}>
              <CommentsActivityBody
                noteDraft={noteDraft}
                setNoteDraft={setNoteDraft}
                submitNote={submitNote}
                addNotePending={addNote.isPending}
                activities={activities}
              />
            </Card>
          </div>
          <div className="hidden lg:block">
            <StickyOnScrollPanel>
              <Card title="Comments & Activity" icon={MessageSquare}>
                <CommentsActivityBody
                  noteDraft={noteDraft}
                  setNoteDraft={setNoteDraft}
                  submitNote={submitNote}
                  addNotePending={addNote.isPending}
                  activities={activities}
                  scrollableTimeline
                />
              </Card>
            </StickyOnScrollPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
