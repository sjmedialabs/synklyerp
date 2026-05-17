"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserFormDialog } from "@/modules/organisation/components/user-form-dialog";
import { useOrgUsers, useUserStats, useUserMutations, useBranches, useDesignations, useRoles } from "@/hooks/organisation";
import type { OrgUser } from "@/lib/mappers/organisation";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrgUser | null>(null);

  const { data: users = [], isLoading, error } = useOrgUsers(search, statusFilter);
  const { data: stats } = useUserStats();
  const { data: branches = [] } = useBranches();
  const { data: designations = [] } = useDesignations();
  const { data: roles = [] } = useRoles();
  const { create, update, remove } = useUserMutations();

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editing) {
        const { password, ...rest } = data;
        await update.mutateAsync({ id: editing.id, ...rest, ...(password ? { password } : {}) });
        toast.success("User updated");
      } else {
        await create.mutateAsync(data);
        toast.success("User created");
      }
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  const initials = (name: string | null) =>
    (name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHeader title="Users" description="Manage workspace users, roles, and access." actions={
        <Button className="bg-indigo-600 text-white" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} className="mr-2" /> Add User</Button>
      } />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats?.total ?? 0 },
          { label: "Active", value: stats?.active ?? 0 },
          { label: "Managers", value: stats?.managers ?? 0 },
          { label: "Admins", value: stats?.admins ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input type="search" placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              {["#","Name","Code","Email","Designation","Department","Branch","Role","Status","Joined","Actions"].map(h=>(
                <th key={h} className="px-3 py-3 text-left font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={u.id} className="border-t">
                <td className="px-3 py-3">{i+1}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">{initials(u.name)}</span>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3">{u.userCode ?? "—"}</td>
                <td className="px-3 py-3">{u.email}</td>
                <td className="px-3 py-3">{u.designation?.name ?? "—"}</td>
                <td className="px-3 py-3">{u.department ?? "—"}</td>
                <td className="px-3 py-3">{u.branch?.name ?? "—"}</td>
                <td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{u.role?.name ?? "—"}</span></td>
                <td className="px-3 py-3">{u.status}</td>
                <td className="px-3 py-3">{new Date(u.joinedAt).toLocaleDateString()}</td>
                <td className="px-3 py-3 flex gap-2">
                  <button type="button" onClick={()=>{setEditing(u);setOpen(true);}}><Pencil size={16}/></button>
                  <button type="button" onClick={()=>{if(confirm("Delete user?"))remove.mutate(u.id,{onSuccess:()=>toast.success("Deleted")});}}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserFormDialog open={open} onClose={()=>setOpen(false)} onSubmit={handleSubmit} initial={editing} branches={branches} designations={designations} roles={roles} />
    </div>
  );
}
