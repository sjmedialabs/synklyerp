"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { usePricingRules, usePricingMutations } from "@/hooks/modules";
import type { PricingRule } from "@/lib/mappers/modules";

export default function PricingRulesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const { data: rules = [], isLoading, error } = usePricingRules(search);
  const { create, update, remove } = usePricingMutations();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      segment: (fd.get("segment") as string) || undefined,
      condition: (fd.get("condition") as string) || undefined,
      adjustment: Number(fd.get("adjustment")),
      status: fd.get("status") as "ACTIVE" | "INACTIVE",
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...body });
        toast.success("Pricing rule updated");
      } else {
        await create.mutateAsync(body);
        toast.success("Pricing rule created");
      }
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pricing Rules"
        description="Segment-based pricing adjustments for your service catalog."
        actions={
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} className="mr-2" /> Add Rule
          </Button>
        }
      />
      <div className="mb-4">
        <Input type="search" placeholder="Search rules..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>
      {isLoading && <div className="flex gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              {["Name", "Segment", "Adjustment", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 && !isLoading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No pricing rules.</td></tr>
            ) : (
              rules.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{r.segment ?? "—"}</td>
                  <td className="px-4 py-3">{r.adjustment}%</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" className="text-slate-500 hover:text-indigo-600" onClick={() => { setEditing(r); setOpen(true); }}><Pencil size={16} /></button>
                      <button type="button" className="text-slate-500 hover:text-rose-600" onClick={() => { if (confirm("Delete?")) remove.mutate(r.id, { onSuccess: () => toast.success("Deleted") }); }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Rule" : "Add Rule"}>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Name *</Label><Input name="name" defaultValue={editing?.name} required /></div>
          <div><Label>Segment</Label><Input name="segment" defaultValue={editing?.segment ?? ""} /></div>
          <div><Label>Condition</Label><Input name="condition" defaultValue={editing?.condition ?? ""} /></div>
          <div><Label>Adjustment (%)</Label><Input name="adjustment" type="number" defaultValue={editing?.adjustment ?? 0} required /></div>
          <div><Label>Status</Label><Select name="status" defaultValue={editing?.status ?? "ACTIVE"}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 text-white">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
