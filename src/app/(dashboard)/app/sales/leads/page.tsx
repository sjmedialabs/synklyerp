"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { LEAD_STATUSES } from "@/constants/roles";
import { useLeadMutations, useLeads } from "@/hooks/sales/crm";
import type { Lead } from "@/lib/mappers/modules";

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const { data: leads = [], isLoading, error } = useLeads(search);
  const { create, update, remove } = useLeadMutations();

  const counts = LEAD_STATUSES.reduce(
    (acc, s) => {
      acc[s] = leads.filter((l) => l.status === s).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      company: (fd.get("company") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      leadType: (fd.get("leadType") as string) || "INBOUND",
      source: (fd.get("source") as string) || undefined,
      status: (fd.get("status") as string) || "FRESH_LEAD",
      notes: (fd.get("notes") as string) || undefined,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...body });
        toast.success("Lead updated");
      } else {
        await create.mutateAsync(body);
        toast.success("Lead created");
      }
      setOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Lead Management"
        description="Pipeline, assignments, source attribution, and conversion tracking."
        badge={
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            {leads.length} total
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Link href="/app/sales/capture">
              <Button variant="outline">Lead Capture Hub</Button>
            </Link>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" /> New Lead
            </Button>
          </div>
        }
      />

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

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
              {["Date", "Company", "Contact", "Source", "Type", "Status", "Assignee", ""].map((h) => (
                <th key={h || "actions"} className="px-4 py-3 text-left font-medium text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  No leads yet. Add your first lead or connect a capture source.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{lead.company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/app/sales/leads/${lead.id}`} className="font-medium text-indigo-600 hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{lead.originalSource ?? lead.source ?? "—"}</td>
                  <td className="px-4 py-3">{lead.leadType}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                      {lead.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">{lead.assignee?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/app/sales/leads/${lead.id}`} className="p-1 text-slate-500 hover:text-indigo-600">
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        type="button"
                        className="p-1 text-slate-500 hover:text-indigo-600"
                        onClick={() => {
                          setEditing(lead);
                          setOpen(true);
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-slate-500 hover:text-rose-600"
                        onClick={() => {
                          if (confirm("Delete this lead?")) {
                            remove.mutate(lead.id, { onSuccess: () => toast.success("Lead deleted") });
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Lead" : "New Lead"}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Contact name *</Label>
            <Input name="name" defaultValue={editing?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company</Label>
              <Input name="company" defaultValue={editing?.company ?? ""} />
            </div>
            <div>
              <Label>Lead type *</Label>
              <Input name="leadType" defaultValue={editing?.leadType ?? "INBOUND"} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={editing?.email ?? ""} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="phone" defaultValue={editing?.phone ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Source</Label>
              <Input name="source" defaultValue={editing?.source ?? ""} disabled={!!editing?.originalSource} />
              {editing?.originalSource && (
                <p className="mt-1 text-xs text-slate-500">Original source is immutable: {editing.originalSource}</p>
              )}
            </div>
            <div>
              <Label>Status</Label>
              <Select name="status" defaultValue={editing?.status ?? "FRESH_LEAD"}>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Input name="notes" defaultValue={editing?.notes ?? ""} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 text-white">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
