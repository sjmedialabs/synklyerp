"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaxDialog } from "@/modules/organisation/components/tax-dialog";
import { useOrgTaxes, useOrgTaxMutations } from "@/hooks/modules";
import type { OrgTax } from "@/lib/mappers/modules";

export default function TaxesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrgTax | null>(null);

  const { data: taxes = [], isLoading, error } = useOrgTaxes(search);
  const { create, update, remove } = useOrgTaxMutations();

  const handleSubmit = async (data: Parameters<typeof create.mutateAsync>[0]) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...(data as object) });
        toast.success("Tax updated");
      } else {
        await create.mutateAsync(data);
        toast.success("Tax created");
      }
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  return (
    <div>
      <PageHeader
        title="Taxes"
        description="Configure tax rates and types for your organisation."
        actions={
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} className="mr-2" /> Add Tax
          </Button>
        }
      />

      <div className="mb-4">
        <Input type="search" placeholder="Search taxes..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading && <div className="flex gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
            <tr>
              {["Name", "Rate", "Type", "Status", "Created", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {taxes.length === 0 && !isLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No taxes configured.</td></tr>
            ) : (
              taxes.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">{t.rate}%</td>
                  <td className="px-4 py-3">{t.type}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" className="text-slate-500 hover:text-indigo-600" onClick={() => { setEditing(t); setOpen(true); }}><Pencil size={16} /></button>
                      <button type="button" className="text-slate-500 hover:text-rose-600" onClick={() => { if (confirm("Delete this tax?")) remove.mutate(t.id, { onSuccess: () => toast.success("Deleted") }); }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TaxDialog open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} initial={editing} />
    </div>
  );
}
