"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Handshake,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Pin,
  Save,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { AccountManagerSelect } from "@/components/sales/leads/account-manager-select";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { LEAD_STATUSES } from "@/constants/roles";
import { useServices } from "@/hooks/modules";
import { useLeadMutations } from "@/hooks/sales/crm";
import type { CrmLeadActivity } from "@/lib/mappers/crm";
import type { Lead } from "@/lib/mappers/modules";
import {
  DETAIL_PROGRESS_STEPS,
  detailProgressLabel,
  leadAgeDays,
  leadTypeBadgeClass,
  progressPercent,
  statusBadgeClass,
  statusLabel,
} from "@/lib/sales/lead-stages";
import { cn } from "@/lib/utils";

const LEAD_TYPES = ["INBOUND", "OUTBOUND", "WEBSITE", "REFERRAL", "FACEBOOK", "GOOGLE", "LINKEDIN", "CAMPAIGN"] as const;

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
  leadType: string;
  status: string;
  progress: number;
  notes: string;
  assignedTo: string | null;
  serviceId: string;
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
    leadType: lead.leadType,
    status: lead.status,
    progress: progressPercent(lead.status, lead.progress),
    notes: lead.notes ?? "",
    assignedTo: lead.assignedTo,
    serviceId: lead.serviceId ?? "",
  };
}

function DetailField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon size={13} className="text-slate-400" />
        {label}
      </div>
      {children}
    </div>
  );
}

type Props = {
  lead: Lead;
  activities: CrmLeadActivity[];
};

export function LeadDetailEditor({ lead, activities }: Props) {
  const { update } = useLeadMutations();
  const { data: services = [] } = useServices();
  const [form, setForm] = useState<FormState>(() => toFormState(lead));
  const [dirty, setDirty] = useState(false);

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
        leadType: form.leadType,
        status: form.status,
        progress: form.progress,
        notes: form.notes || undefined,
        assignedTo: form.assignedTo ?? "",
        serviceId: form.serviceId || undefined,
      });
      toast.success("Lead updated");
      setDirty(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const pct = form.progress;
  const ageDays = leadAgeDays(lead.createdAt);
  const progressTag = detailProgressLabel(form.status);
  const assigneeName = useMemo(() => {
    if (form.assignedTo === lead.assignedTo) return lead.assignee?.name;
    return null;
  }, [form.assignedTo, lead.assignedTo, lead.assignee?.name]);

  const serviceName =
    services.find((s) => s.id === form.serviceId)?.name ?? lead.service?.name ?? null;

  let activeProgressIdx = DETAIL_PROGRESS_STEPS.findIndex((s) => s.key === form.status);
  if (activeProgressIdx < 0 && form.status === "QUALIFIED") activeProgressIdx = 1;

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              {initials(form.name || "?")}
            </div>
            <div>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="border-0 bg-transparent p-0 text-lg font-bold shadow-none focus-visible:ring-0"
                aria-label="Contact name"
              />
              <Input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Company name"
                className="mt-0.5 border-0 bg-transparent p-0 text-sm text-slate-500 shadow-none focus-visible:ring-0"
                aria-label="Company"
              />
            </div>
          </div>
          <Button
            type="button"
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto"
            disabled={!dirty || update.isPending}
            onClick={save}
          >
            {update.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            Save changes
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadgeClass(form.status))}>
            {statusLabel(form.status)}
          </span>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">{progressTag}</span>
          {serviceName && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{serviceName}</span>
          )}
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", leadTypeBadgeClass(form.leadType))}>
            {form.leadType.replace(/_/g, " ")}
          </span>
          {(assigneeName || form.assignedTo) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              <User size={12} />
              {assigneeName ?? "Assigned"}
            </span>
          )}
        </div>
      </div>

      {/* Lead details grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailField icon={Phone} label="Phone">
          <Input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            placeholder="—"
          />
        </DetailField>
        <DetailField icon={Mail} label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="border-0 bg-transparent p-0 text-indigo-600 shadow-none focus-visible:ring-0"
            placeholder="—"
          />
        </DetailField>
        <DetailField icon={Wrench} label="Service">
          <Select
            value={form.serviceId}
            onChange={(e) => set("serviceId", e.target.value)}
            className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          >
            <option value="">—</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </DetailField>
        <DetailField icon={Calendar} label="Lead date">
          <p className="text-sm font-medium text-slate-900">{new Date(lead.createdAt).toLocaleDateString()}</p>
        </DetailField>
        <DetailField icon={Clock} label="Age of lead">
          <p className="text-sm font-medium text-slate-900">
            {ageDays} {ageDays === 1 ? "day" : "days"}
          </p>
        </DetailField>
        <DetailField icon={User} label="Assigned to">
          <AccountManagerSelect
            value={form.assignedTo}
            displayLabel={lead.assignee?.name}
            onChange={(userId) => set("assignedTo", userId)}
            compact
            className="[&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:shadow-none"
          />
        </DetailField>
        <DetailField icon={BarChart3} label="Status">
          <Select
            value={form.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </DetailField>
        <DetailField icon={MessageSquare} label="Lead type">
          <Select
            value={form.leadType}
            onChange={(e) => set("leadType", e.target.value)}
            className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          >
            {LEAD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </DetailField>
      </div>

      {/* Lead progress */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Pin size={15} className="text-indigo-600" />
          Lead Progress
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DETAIL_PROGRESS_STEPS.map((step) => {
            const Icon = PROGRESS_ICONS[step.key as keyof typeof PROGRESS_ICONS];
            const active = form.status === step.key || (form.status === "QUALIFIED" && step.key === "PROSPECT");
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => selectProgressStage(step.key)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all",
                  active
                    ? "border-indigo-500 bg-indigo-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {active && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />}
                <Icon size={18} className={active ? "text-indigo-600" : "text-slate-400"} />
                <span className={cn("text-xs font-medium", active ? "text-indigo-700" : "text-slate-600")}>{step.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Progress</span>
            <span className="font-semibold text-indigo-600">{pct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-indigo-600 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={pct}
            onChange={(e) => set("progress", Number(e.target.value))}
            className="mt-2 w-full accent-indigo-600"
            aria-label="Lead progress percentage"
          />
          {/* Stage tags under the bar */}
          <div className="relative mt-3 h-8">
            {DETAIL_PROGRESS_STEPS.map((step, i) => {
              const left = `${(i / (DETAIL_PROGRESS_STEPS.length - 1)) * 100}%`;
              const active = activeProgressIdx === i || (form.status === "QUALIFIED" && step.key === "PROSPECT");
              return (
                <span
                  key={step.key}
                  className={cn(
                    "absolute -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs",
                    active ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500"
                  )}
                  style={{ left }}
                >
                  {step.shortLabel}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">
            Current stage: <span className="font-medium text-indigo-600">{progressTag}</span>
            {pct > 0 && <span className="text-slate-400"> · {pct}% complete</span>}
          </p>
        </div>
      </section>

      {/* Comments & activity */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MessageSquare size={15} className="text-indigo-600" />
          Comments & Activity
        </h2>
        <div className="mt-3">
          <Label className="text-xs text-slate-500">Add a note</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Write comments or follow-up notes..."
            className="mt-1"
          />
        </div>
        {activities.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No activity recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            {activities.map((a) => (
              <li key={a.id} className="border-l-2 border-indigo-200 pl-3">
                <p className="text-sm font-medium text-slate-900">{a.title}</p>
                {a.description && <p className="text-xs text-slate-500">{a.description}</p>}
                <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
