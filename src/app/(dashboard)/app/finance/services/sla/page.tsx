"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useServiceSlas, useSlaMutations } from "@/hooks/modules";
import type { ServiceSLA } from "@/lib/mappers/modules";

export default function SlaPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceSLA | null>(null);
  const { data: slas = [], isLoading, error } = useServiceSlas(search);
  const { create, update, remove } = useSlaMutations();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      serviceName: fd.get("serviceName") as string,
      responseTime: fd.get("responseTime") as string,
      resolutionTime: fd.get("resolutionTime") as string,
      escalationRules: (fd.get("escalationRules") as string) || undefined,
      status: fd.get("status") as "ACTIVE" | "INACTIVE",
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...body });
        toast.success("SLA updated");
      } else {
        await create.mutateAsync(body);
        toast.success("SLA created");
      }
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader title="SLA & Policies" description="Response and resolution commitments per service." actions={<Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} className="mr-2" /> Add SLA</Button>} />
      <div className="mb-4"><Input type="search" placeholder="Search SLAs..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /></div>
      {isLoading && <div className="flex gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50"><tr>{["Service", "Response", "Resolution", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>)}</tr></thead>
          <tbody>
            {slas.length === 0 && !isLoading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No SLAs configured.</td></tr> : slas.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3 font-medium">{s.serviceName}</td>
                <td className="px-4 py-3">{s.responseTime}</td>
                <td className="px-4 py-3">{s.resolutionTime}</td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button type="button" onClick={() => { setEditing(s); setOpen(true); }}><Pencil size={16} /></button>
                  <button type="button" onClick={() => { if (confirm("Delete?")) remove.mutate(s.id, { onSuccess: () => toast.success("Deleted") }); }}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit SLA" : "Add SLA"}>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Service Name *</Label><Input name="serviceName" defaultValue={editing?.serviceName} required /></div>
          <div><Label>Response Time *</Label><Input name="responseTime" defaultValue={editing?.responseTime} placeholder="e.g. 2 hours" required /></div>
          <div><Label>Resolution Time *</Label><Input name="resolutionTime" defaultValue={editing?.resolutionTime} placeholder="e.g. 24 hours" required /></div>
          <div><Label>Escalation Rules</Label><Input name="escalationRules" defaultValue={editing?.escalationRules ?? ""} /></div>
          <div><Label>Status</Label><Select name="status" defaultValue={editing?.status ?? "ACTIVE"}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-indigo-600 text-white">Save</Button></div>
        </form>
      </Modal>
    </div>
  );
}
