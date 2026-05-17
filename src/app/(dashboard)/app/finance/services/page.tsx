"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useServices, useServiceMutations } from "@/hooks/modules";
import type { Service } from "@/lib/mappers/modules";

export default function ServicesHubPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const { data: services = [], isLoading, error } = useServices(search);
  const { create, update, remove } = useServiceMutations();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      category: fd.get("category") as string,
      description: (fd.get("description") as string) || undefined,
      basePrice: Number(fd.get("basePrice")),
      unit: fd.get("unit") as string,
      status: (fd.get("status") as "ACTIVE" | "INACTIVE") || "ACTIVE",
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...body });
        toast.success("Service updated");
      } else {
        await create.mutateAsync(body);
        toast.success("Service created");
      }
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Service Catalog"
        description="Manage services, pricing, packages, and SLAs from the Services Hub navigation."
        actions={
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} className="mr-2" /> New Service
          </Button>
        }
      />
      <div className="mb-4">
        <Input type="search" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>
      {isLoading && <div className="flex gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
            <tr>
              {["Name", "Category", "Base Price", "Unit", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.length === 0 && !isLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No services found.</td></tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.category}</td>
                  <td className="px-4 py-3">₹{s.basePrice.toLocaleString()}</td>
                  <td className="px-4 py-3">{s.unit}</td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" className="text-slate-500 hover:text-indigo-600" onClick={() => { setEditing(s); setOpen(true); }}><Pencil size={16} /></button>
                      <button type="button" className="text-slate-500 hover:text-rose-600" onClick={() => { if (confirm("Delete?")) remove.mutate(s.id, { onSuccess: () => toast.success("Deleted") }); }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Service" : "New Service"}>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Name *</Label><Input name="name" defaultValue={editing?.name} required /></div>
          <div><Label>Category *</Label>
            <Select name="category" defaultValue={editing?.category ?? ""} required>
              <option value="">Select...</option>
              <option value="Consulting">Consulting</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Implementation">Implementation</option>
              <option value="Subscription">Subscription</option>
            </Select>
          </div>
          <div><Label>Description</Label><Input name="description" defaultValue={editing?.description ?? ""} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Base Price (₹) *</Label><Input name="basePrice" type="number" min={0} defaultValue={editing?.basePrice ?? 0} required /></div>
            <div><Label>Unit *</Label><Input name="unit" defaultValue={editing?.unit ?? "per hour"} required /></div>
          </div>
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
