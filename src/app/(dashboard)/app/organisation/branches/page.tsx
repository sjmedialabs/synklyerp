"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Power } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BranchWizard } from "@/modules/organisation/components/branch-wizard";
import { useBranches, useBranchMutations } from "@/hooks/organisation";
import type { Branch } from "@/lib/mappers/organisation";

export default function BranchesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const { data: branches = [], isLoading, error } = useBranches(search);
  const { create, update, remove, toggleStatus } = useBranchMutations();

  const handleSubmit = async (data: Parameters<typeof create.mutateAsync>[0]) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...data as object });
        toast.success("Branch updated");
      } else {
        await create.mutateAsync(data);
        toast.success("Branch created");
      }
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  return (
    <div>
      <PageHeader
        title="Branches"
        description="Manage office locations, codes, and regional structure."
        actions={
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} className="mr-2" /> Add Branch
          </Button>
        }
      />

      <div className="mb-4">
        <Input type="search" placeholder="Search branches..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading && <div className="flex gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
            <tr>
              {["#", "Branch Name", "Code", "Location", "Country", "Status", "Type", "Created", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 && !isLoading ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No branches found.</td></tr>
            ) : (
              branches.map((b, i) => (
                <tr key={b.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3">{b.code}</td>
                  <td className="px-4 py-3">{[b.city, b.state].filter(Boolean).join(", ")}</td>
                  <td className="px-4 py-3">{b.country}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{b.officeType}</td>
                  <td className="px-4 py-3">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" className="text-slate-500 hover:text-indigo-600" onClick={() => { setEditing(b); setOpen(true); }}><Pencil size={16} /></button>
                      <button type="button" className="text-slate-500 hover:text-amber-600" onClick={() => toggleStatus.mutate({ id: b.id, status: b.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }, { onSuccess: () => toast.success("Status updated") })}><Power size={16} /></button>
                      <button type="button" className="text-slate-500 hover:text-rose-600" onClick={() => { if (confirm("Delete this branch?")) remove.mutate(b.id, { onSuccess: () => toast.success("Deleted") }); }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <BranchWizard open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} initial={editing} />
    </div>
  );
}
