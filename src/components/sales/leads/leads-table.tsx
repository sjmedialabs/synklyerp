"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/mappers/modules";
import type { CrmLeadActivity } from "@/lib/mappers/crm";
import {
  PIPELINE_STEPS,
  leadTypeBadgeClass,
  progressPercent,
  statusBadgeClass,
  statusLabel,
} from "@/lib/sales/lead-stages";
import { ScrollableTableShell } from "@/components/sales/leads/scrollable-table-shell";

function CompanyAvatar({ name }: { name: string }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
      {initial}
    </div>
  );
}

function LeadProgress({ status, progress }: { status: string; progress: number }) {
  const pct = progressPercent(status, progress);
  const activeIdx = PIPELINE_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="min-w-[140px] space-y-1.5">
      <div className="flex items-center gap-0.5">
        {PIPELINE_STEPS.map((step, i) => {
          const done = status === "CONVERTED" || i <= activeIdx;
          const current = step.key === status;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center" title={step.label}>
              <div
                className={cn(
                  "h-2 w-2 rounded-full border",
                  done ? "border-indigo-500 bg-indigo-500" : "border-slate-300 bg-white",
                  current && "ring-2 ring-indigo-500/30"
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-slate-500">{pct}%</p>
    </div>
  );
}

function ExpandedRow({ lead, activities }: { lead: Lead; activities?: CrmLeadActivity[] }) {
  return (
    <div className="grid gap-4 border-t border-slate-100 bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
        <p className="mt-1 text-slate-700">{lead.notes ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lead source</p>
        <p className="mt-1 text-slate-700">{lead.originalSource ?? lead.source ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lead score</p>
        <p className="mt-1 text-slate-700">{lead.leadScore}</p>
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Recent activities</p>
        {activities?.length ? (
          <ul className="mt-2 space-y-1 text-slate-600">
            {activities.slice(0, 5).map((a) => (
              <li key={a.id}>
                <span className="font-medium text-slate-900">{a.title}</span> · {new Date(a.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-slate-500">No activities yet.</p>
        )}
      </div>
    </div>
  );
}

export type SortField = "createdAt" | "company" | "leadType" | "status" | "assignedTo";

type Props = {
  leads: Lead[];
  selected: Set<string>;
  expandedId: string | null;
  sortBy: SortField;
  sortOrder: "asc" | "desc";
  activitiesMap: Record<string, CrmLeadActivity[]>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onExpand: (id: string) => void;
  onSort: (field: SortField) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
};

function HeaderCell({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  className,
  sortable = true,
}: {
  label: string;
  field?: SortField;
  sortBy: SortField;
  sortOrder: "asc" | "desc";
  onSort: (f: SortField) => void;
  className?: string;
  sortable?: boolean;
}) {
  const active = field && sortBy === field;
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-slate-600",
        className
      )}
    >
      {sortable && field ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-indigo-600"
          onClick={() => onSort(field)}
          aria-label={`Sort by ${label}`}
        >
          {label}
          {active && (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </button>
      ) : (
        label
      )}
    </th>
  );
}

export function LeadsTable({
  leads,
  selected,
  expandedId,
  sortBy,
  sortOrder,
  activitiesMap,
  onToggleSelect,
  onToggleSelectAll,
  onExpand,
  onSort,
  onEdit,
  onDelete,
}: Props) {
  const allSelected = leads.length > 0 && leads.every((l) => selected.has(l.id));

  return (
    <div className="hidden lg:block">
      <ScrollableTableShell className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1400px] text-sm">
          <thead className="sticky top-0 z-[1] border-b bg-slate-50">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all leads"
                  className="rounded border-slate-300"
                />
              </th>
              <HeaderCell label="Date" field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              <HeaderCell label="Company Name" field="company" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              <HeaderCell label="Contact Name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} sortable={false} />
              <HeaderCell label="Lead Type" field="leadType" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              <HeaderCell label="Service Required" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} sortable={false} />
              <HeaderCell label="Contact Number" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} sortable={false} />
              <HeaderCell label="Email ID" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} sortable={false} />
              <HeaderCell label="Status" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              <HeaderCell label="Lead Progress" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} sortable={false} />
              <HeaderCell label="Account Manager" field="assignedTo" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              <HeaderCell label="Actions" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} sortable={false} className="text-right" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => {
              const isExpanded = expandedId === lead.id;
              return (
                <Fragment key={lead.id}>
                  <tr
                    className={cn(
                      "group border-t transition-colors hover:bg-slate-50",
                      i % 2 === 1 && "bg-slate-50/50",
                      isExpanded && "bg-indigo-50/50"
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => onToggleSelect(lead.id)}
                        aria-label={`Select ${lead.name}`}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[160px] items-center gap-2">
                        {lead.company && <CompanyAvatar name={lead.company} />}
                        <span className="font-medium text-slate-900">{lead.company ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" className="font-medium text-slate-900 hover:text-indigo-600" onClick={() => onExpand(lead.id)}>
                        {lead.name}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", leadTypeBadgeClass(lead.leadType))}>
                        {lead.leadType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.service?.name ? (
                        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">{lead.service.name}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{lead.phone ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{lead.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadgeClass(lead.status))}>
                        {statusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <LeadProgress status={lead.status} progress={lead.progress} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{lead.assignee?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-80 transition-opacity group-hover:opacity-100">
                        <Link href={`/app/sales/leads/${lead.id}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600" title="View" aria-label="View lead">
                          <Eye size={16} />
                        </Link>
                        <button type="button" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600" title="Edit" aria-label="Edit lead" onClick={() => onEdit(lead)}>
                          <Pencil size={16} />
                        </button>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600" title="Call" aria-label="Call lead">
                            <Phone size={16} />
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600" title="Email" aria-label="Email lead">
                            <Mail size={16} />
                          </a>
                        )}
                        <button type="button" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600" title="Notes" aria-label="Expand row" onClick={() => onExpand(lead.id)}>
                          <MessageSquare size={16} />
                        </button>
                        <button type="button" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600" title="Delete" aria-label="Delete lead" onClick={() => onDelete(lead.id)}>
                          <Trash2 size={16} />
                        </button>
                        <button type="button" className="rounded-lg p-1.5 text-slate-400" aria-label="More actions">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={12}>
                        <ExpandedRow lead={lead} activities={activitiesMap[lead.id]} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </ScrollableTableShell>
    </div>
  );
}
