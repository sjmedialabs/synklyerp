"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useServicePackages, usePackageMutations } from "@/hooks/modules";
import type { ServicePackage } from "@/lib/mappers/modules";

export default function ServicePackagesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServicePackage | null>(null);
  const { data: packages = [], isLoading, error } = useServicePackages(search);
  const { create, update, remove } = usePackageMutations();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      includedServices: [],
      discount: Number(fd.get("discount")),
      validityDays: fd.get("validityDays") ? Number(fd.get("validityDays")) : undefined,
      status: fd.get("status") as "ACTIVE" | "INACTIVE",
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...body });
        toast.success("Package updated");
      } else {
        await create.mutateAsync(body);
        toast.success("Package created");
      }
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader title="Service Packages" description="Bundle services with discounts and validity periods." actions={<Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} className="mr-2" /> Add Package</Button>} />
      <div className="mb-4"><Input type="search" placeholder="Search packages..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /></div>
      {isLoading && <div className="flex gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50"><tr>{["Name", "Discount", "Validity", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>)}</tr></thead>
          <tbody>
            {packages.length === 0 && !isLoading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No packages.</td></tr> : packages.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.discount}%</td>
                <td className="px-4 py-3">{p.validityDays ? `${p.validityDays} days` : "—"}</td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button type="button" onClick={() => { setEditing(p); setOpen(true); }}><Pencil size={16} /></button>
                  <button type="button" onClick={() => { if (confirm("Delete?")) remove.mutate(p.id, { onSuccess: () => toast.success("Deleted") }); }}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Package" : "Add Package"}>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Name *</Label><Input name="name" defaultValue={editing?.name} required /></div>
          <div><Label>Discount (%)</Label><Input name="discount" type="number" defaultValue={editing?.discount ?? 0} required /></div>
          <div><Label>Validity (days)</Label><Input name="validityDays" type="number" defaultValue={editing?.validityDays ?? ""} /></div>
          <div><Label>Status</Label><Select name="status" defaultValue={editing?.status ?? "ACTIVE"}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-indigo-600 text-white">Save</Button></div>
        </form>
      </Modal>
    </div>
  );
}
