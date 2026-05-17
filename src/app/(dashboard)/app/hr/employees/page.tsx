"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeFormDialog } from "@/modules/hr/components/employee-form-dialog";
import { useEmployees, useEmployeeStats, useEmployeeMutations } from "@/hooks/modules";
import type { Employee } from "@/lib/mappers/modules";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const { data: employees = [], isLoading, error } = useEmployees(search, statusFilter);
  const { data: stats } = useEmployeeStats();
  const { create, update, remove } = useEmployeeMutations();

  const handleSubmit = async (data: Parameters<typeof create.mutateAsync>[0]) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...(data as object) });
        toast.success("Employee updated");
      } else {
        await create.mutateAsync(data);
        toast.success("Employee created");
      }
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  const statCards = [
    { label: "Total", value: stats?.total ?? 0 },
    { label: "Active", value: stats?.active ?? 0 },
    { label: "On Probation", value: stats?.onProbation ?? 0 },
    { label: "New This Month", value: stats?.newThisMonth ?? 0 },
  ];

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Manage employee records, assignments, and employment details."
        actions={
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} className="mr-2" /> Add Employee
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input type="search" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="On Probation">On Probation</option>
          <option value="Inactive">Inactive</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      {isLoading && <div className="flex gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
            <tr>
              {["Code", "Name", "Designation", "Branch", "Division", "Type", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && !isLoading ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No employees found.</td></tr>
            ) : (
              employees.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-mono text-xs">{e.employeeCode}</td>
                  <td className="px-4 py-3 font-medium">{e.fullName}</td>
                  <td className="px-4 py-3">{e.designation?.name ?? "—"}</td>
                  <td className="px-4 py-3">{e.branch?.name ?? "—"}</td>
                  <td className="px-4 py-3">{e.division?.name ?? "—"}</td>
                  <td className="px-4 py-3">{e.employmentType.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{e.status}</span>
                  </td>
                  <td className="px-4 py-3">{new Date(e.dateOfJoining).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" className="text-slate-500 hover:text-indigo-600" onClick={() => { setEditing(e); setOpen(true); }}><Pencil size={16} /></button>
                      <button type="button" className="text-slate-500 hover:text-rose-600" onClick={() => { if (confirm("Remove this employee?")) remove.mutate(e.id, { onSuccess: () => toast.success("Removed") }); }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EmployeeFormDialog open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} initial={editing} />
    </div>
  );
}
