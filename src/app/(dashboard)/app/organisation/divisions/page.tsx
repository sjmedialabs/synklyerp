"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Power } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DivisionWizard } from "@/modules/organisation/components/division-wizard";
import { useDivisions, useDivisionMutations } from "@/hooks/organisation";
import type { Division } from "@/lib/mappers/organisation";

export default function DivisionsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Division | null>(null);
  const { data: divisions = [], isLoading, error } = useDivisions(search);
  const { create, update, remove, toggleStatus } = useDivisionMutations();

  const handleSubmit = async (data: unknown) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...(data as object) });
        toast.success("Division updated");
      } else {
        await create.mutateAsync(data);
        toast.success("Division created");
      }
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  return (
    <div>
      <PageHeader title="Divisions" description="Organize teams and assign modules per division." actions={
        <Button className="bg-indigo-600 text-white" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} className="mr-2" /> Add Division</Button>
      } />
      <div className="mb-4"><Input type="search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /></div>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {error && <p className="text-rose-600 text-sm">{(error as Error).message}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50"><tr>{["#","Division","Code","Modules","Status","Created","Actions"].map(h=><th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>)}</tr></thead>
          <tbody>
            {divisions.map((d,i)=>(
              <tr key={d.id} className="border-t">
                <td className="px-4 py-3">{i+1}</td>
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3">{d.code}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{d.modulesAssigned.map(m=><span key={m} className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">{m}</span>)}</div></td>
                <td className="px-4 py-3">{d.status}</td>
                <td className="px-4 py-3">{new Date(d.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button type="button" onClick={()=>{setEditing(d);setOpen(true);}}><Pencil size={16}/></button>
                  <button type="button" onClick={()=>toggleStatus.mutate({id:d.id,status:d.status==="ACTIVE"?"INACTIVE":"ACTIVE"})}><Power size={16}/></button>
                  <button type="button" onClick={()=>{if(confirm("Delete?"))remove.mutate(d.id);}}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DivisionWizard open={open} onClose={()=>setOpen(false)} onSubmit={handleSubmit} initial={editing} />
    </div>
  );
}

function motion({className,children}:{className?:string;children:React.ReactNode}){return <div className={className}>{children}</div>;}
