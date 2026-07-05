"use client";

import Link from "next/link";
import { Eye, Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/mappers/modules";
import { leadTypeBadgeClass, statusBadgeClass, statusLabel } from "@/lib/sales/lead-stages";

type Props = {
  leads: Lead[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
};

export function LeadsMobileCards({ leads, selected, onToggleSelect, onEdit, onDelete }: Props) {
  return (
    <div className="space-y-3 lg:hidden">
      {leads.map((lead) => (
        <article
          key={lead.id}
          className={cn(
            "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
            selected.has(lead.id) && "ring-2 ring-indigo-500/40"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(lead.id)}
                onChange={() => onToggleSelect(lead.id)}
                aria-label={`Select ${lead.name}`}
                className="mt-1 rounded border-slate-300"
              />
              <div>
                <p className="font-bold text-slate-900">{lead.company ?? "No company"}</p>
                <p className="mt-0.5 font-medium text-slate-700">{lead.name}</p>
              </div>
            </div>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", statusBadgeClass(lead.status))}>
              {statusLabel(lead.status)}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-sm text-slate-600">
            {lead.phone && (
              <p className="flex items-center gap-2">
                <Phone size={14} /> {lead.phone}
              </p>
            )}
            {lead.email && (
              <p className="flex items-center gap-2">
                <Mail size={14} /> {lead.email}
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", leadTypeBadgeClass(lead.leadType))}>
              {lead.leadType.replace(/_/g, " ")}
            </span>
            {lead.service?.name && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{lead.service.name}</span>
            )}
          </div>

          <p className="mt-2 text-xs text-slate-500">Assigned to {lead.assignee?.name ?? "Unassigned"}</p>

          <div className="mt-4 flex gap-2">
            <Link
              href={`/app/sales/leads/${lead.id}`}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-medium"
            >
              <Eye size={16} /> View
            </Link>
            <button
              type="button"
              onClick={() => onEdit(lead)}
              className="rounded-lg border border-slate-200 p-2"
              aria-label="Edit"
            >
              <Pencil size={16} />
            </button>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="rounded-lg border border-slate-200 p-2" aria-label="Call">
                <Phone size={16} />
              </a>
            )}
            <button
              type="button"
              onClick={() => onDelete(lead.id)}
              className="rounded-lg border border-slate-200 p-2 text-rose-600"
              aria-label="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
