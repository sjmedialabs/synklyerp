"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Power } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DesignationDialog } from "@/modules/organisation/components/designation-dialog";
import { useDesignations, useDesignationMutations } from "@/hooks/organisation";
import type { Designation } from "@/lib/mappers/organisation";

export default function DesignationsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const { data: items = [], isLoading, error } = useDesignations(search);
  const { create, update, remove, toggleStatus } = useDesignationMutations();

  const handleSubmit = async (data: unknown) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...(data as object) });
        toast.success("Designation updated");
      } else {
        await create.mutateAsync(data);
        toast.success("Designation created");
      }
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  return (
    <div>
      <PageHeader title="Designations" description="Job titles used across employee and user records." actions={
        <Button className="bg-indigo-600 text-white" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} className="mr-2" /> Add Designation</Button>
      } />
      <div className="mb-4"><Input type="search" placeholder="Search designations..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /></div>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50"><tr>{["#","Designation","Status","Created","Actions"].map(h=><th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>)}</tr></thead>
          <tbody>
            {items.length===0&&!isLoading?<tr><td colSpan={5} className="py-12 text-center text-slate-500">No designations.</td></tr>:items.map((d,i)=>(
              <tr key={d.id} className="border-t"><td className="px-4 py-3">{i+1}</td><td className="px-4 py-3 font-medium">{d.name}</td><td className="px-4 py-3">{d.status}</td><td className="px-4 py-3">{new Date(d.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button type="button" onClick={()=>{setEditing(d);setOpen(true);}}><Pencil size={16}/></button>
                  <button type="button" onClick={()=>toggleStatus.mutate({id:d.id,status:d.status==="ACTIVE"?"INACTIVE":"ACTIVE"},{onSuccess:()=>toast.success("Updated")})}><Power size={16}/></button>
                  <button type="button" onClick={()=>{if(confirm("Delete?"))remove.mutate(d.id,{onSuccess:()=>toast.success("Deleted")});}}><Trash2 size={16}/></button>
                </td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <DesignationDialog open={open} onClose={()=>setOpen(false)} onSubmit={handleSubmit} initial={editing} />
    </div>
  );
}
