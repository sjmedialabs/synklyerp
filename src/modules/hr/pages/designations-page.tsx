"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  Columns3,
  Filter,
  Info,
  Loader2,
  Network,
  PauseCircle,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DesignationDialog } from "@/modules/organisation/components/designation-dialog";
import {
  useDesignationMutations,
  useDesignationStats,
  useDesignations,
  useDesignationsList,
} from "@/hooks/organisation";
import type { Designation } from "@/lib/mappers/organisation";
import { cn } from "@/lib/utils";

const GRADE_OPTIONS = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10"];

type ColumnKey = "department" | "gradeLevel" | "reportsTo" | "employees";

export default function HrDesignationsPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showColumns, setShowColumns] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(new Set());

  const { data, isLoading, error } = useDesignationsList({
    page,
    limit,
    search: search || undefined,
    department: department || undefined,
    status: status || undefined,
    gradeLevel: gradeLevel || undefined,
  });

  const { data: statsData } = useDesignationStats();
  const { data: allDesignations } = useDesignations();
  const { create, update, remove } = useDesignationMutations();

  const items = data?.items ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const departments = statsData?.filters?.departments ?? [];
  const gradeLevels = statsData?.filters?.gradeLevels?.length
    ? statsData.filters.gradeLevels
    : GRADE_OPTIONS;

  useEffect(() => {
    setPage(1);
  }, [search, department, status, gradeLevel, limit]);

  const allSelected = items.length > 0 && items.every((d) => selected.has(d.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((d) => d.id)));
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleColumn = (key: ColumnKey) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async (formData: unknown) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...(formData as object) });
        toast.success("Designation updated");
      } else {
        await create.mutateAsync(formData);
        toast.success("Designation created");
      }
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  const handleDelete = async (d: Designation) => {
    if (!confirm(`Delete designation "${d.name}"?`)) return;
    try {
      await remove.mutateAsync(d.id);
      toast.success("Designation deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleExport = () => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (department) qs.set("department", department);
    if (status) qs.set("status", status);
    if (gradeLevel) qs.set("gradeLevel", gradeLevel);
    window.location.href = `/api/organisation/designations/export?${qs.toString()}`;
  };

  const statCards = useMemo(
    () => [
      { label: "Total Designations", value: statsData?.total ?? 0, icon: Briefcase },
      { label: "Active Designations", value: statsData?.active ?? 0, icon: Users },
      { label: "Inactive Designations", value: statsData?.inactive ?? 0, icon: PauseCircle },
      { label: "Departments Mapped", value: statsData?.departmentsMapped ?? 0, icon: Network },
    ],
    [statsData]
  );

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const max = Math.min(totalPages, 4);
    let start = Math.max(1, page - 1);
    if (start + max - 1 > totalPages) start = Math.max(1, totalPages - max + 1);
    for (let i = 0; i < max; i++) pages.push(start + i);
    return pages;
  }, [page, totalPages]);

  return (
    <div>
      <PageHeader
        title="Designations"
        badge={<Info size={16} className="text-slate-400" aria-hidden />}
        description="Create and manage job designations in the organization."
        actions={
          <Button
            className="bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" /> Add Designation
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
            <span className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800">
              <Icon size={18} />
            </span>
          </div>
        ))}
      </div>

      {/* Filters: deterministic layout (matches your screenshot) */}
      <div className="mb-4 hidden sm:flex sm:items-center sm:gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Input
            type="search"
            placeholder="Search designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10"
          />
        </div>

        <div className="min-w-[140px]">
          <SearchableSelect
            placeholder="Department"
            value={department || null}
            onChange={(v) => setDepartment(v ?? "")}
            allowClear
            clearLabel="None"
            options={departments.map((d) => ({ value: d, label: d }))}
          />
        </div>

        <div className="min-w-[120px]">
          <SearchableSelect
            placeholder="Status"
            value={status || null}
            onChange={(v) => setStatus(v ?? "")}
            allowClear
            clearLabel="None"
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        </div>

        <div className="min-w-[130px]">
          <SearchableSelect
            placeholder="Grade Level"
            value={gradeLevel || null}
            onChange={(v) => setGradeLevel(v ?? "")}
            allowClear
            clearLabel="None"
            options={gradeLevels.map((g) => ({ value: g, label: g }))}
          />
        </div>

        <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5">
          <Filter size={14} /> More Filters
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 gap-1.5"
          onClick={handleExport}
        >
          <Upload size={14} /> Export
        </Button>

        <div className="relative ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0"
            onClick={() => setShowColumns((v) => !v)}
            aria-label="Column view"
          >
            <Columns3 size={16} />
          </Button>
          {showColumns && (
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {(
                [
                  ["department", "Department"],
                  ["gradeLevel", "Grade Level"],
                  ["reportsTo", "Reports To"],
                  ["employees", "Employees"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={!hiddenColumns.has(key)}
                    onChange={() => toggleColumn(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:hidden">
        <div className="relative w-full">
          <Input
            type="search"
            placeholder="Search designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10"
          />
        </div>

        <SearchableSelect
          placeholder="Department"
          value={department || null}
          onChange={(v) => setDepartment(v ?? "")}
          allowClear
          clearLabel="None"
          options={departments.map((d) => ({ value: d, label: d }))}
        />

        <SearchableSelect
          placeholder="Status"
          value={status || null}
          onChange={(v) => setStatus(v ?? "")}
          allowClear
          clearLabel="None"
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />

        <SearchableSelect
          placeholder="Grade Level"
          value={gradeLevel || null}
          onChange={(v) => setGradeLevel(v ?? "")}
          allowClear
          clearLabel="None"
          options={gradeLevels.map((g) => ({ value: g, label: g }))}
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5">
              <Filter size={14} /> More Filters
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-1.5"
              onClick={handleExport}
            >
              <Upload size={14} /> Export
            </Button>
          </div>

          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0"
              onClick={() => setShowColumns((v) => !v)}
              aria-label="Column view"
            >
              <Columns3 size={16} />
            </Button>
            {showColumns && (
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {(
                  [
                    ["department", "Department"],
                    ["gradeLevel", "Grade Level"],
                    ["reportsTo", "Reports To"],
                    ["employees", "Employees"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.has(key)}
                      onChange={() => toggleColumn(key)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="mb-4 flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}
      {error && <p className="mb-4 text-sm text-rose-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                </th>
                <th className="w-10 px-3 py-3 text-left font-medium text-slate-600">#</th>
                <th className="px-3 py-3 text-left font-medium text-slate-600">Designation Name</th>
                {!hiddenColumns.has("department") && (
                  <th className="px-3 py-3 text-left font-medium text-slate-600">Department</th>
                )}
                {!hiddenColumns.has("gradeLevel") && (
                  <th className="px-3 py-3 text-left font-medium text-slate-600">Grade Level</th>
                )}
                <th className="px-3 py-3 text-left font-medium text-slate-600">Status</th>
                {!hiddenColumns.has("reportsTo") && (
                  <th className="px-3 py-3 text-left font-medium text-slate-600">Reports To</th>
                )}
                {!hiddenColumns.has("employees") && (
                  <th className="px-3 py-3 text-left font-medium text-slate-600">Employees</th>
                )}
                <th className="px-3 py-3 text-right font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No designations found.
                  </td>
                </tr>
              ) : (
                items.map((d, i) => (
                  <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(d.id)}
                        onChange={() => toggleRow(d.id)}
                        aria-label={`Select ${d.name}`}
                      />
                    </td>
                    <td className="px-3 py-3 text-slate-500">{(page - 1) * limit + i + 1}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">{d.name}</td>
                    {!hiddenColumns.has("department") && (
                      <td className="px-3 py-3 text-slate-600">{d.department ?? "—"}</td>
                    )}
                    {!hiddenColumns.has("gradeLevel") && (
                      <td className="px-3 py-3 text-slate-600">{d.gradeLevel ?? "—"}</td>
                    )}
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          d.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {d.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {!hiddenColumns.has("reportsTo") && (
                      <td className="px-3 py-3 text-slate-600">{d.reportsToName ?? "—"}</td>
                    )}
                    {!hiddenColumns.has("employees") && (
                      <td className="px-3 py-3 text-slate-600">{d.employeeCount}</td>
                    )}
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                          onClick={() => {
                            setEditing(d);
                            setOpen(true);
                          }}
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => handleDelete(d)}
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <p>
            Showing {from} to {to} of {total} entries
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </Button>
              {pageNumbers.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={n === page ? "default" : "outline"}
                  size="sm"
                  className={cn("min-w-8", n === page && "bg-slate-900 text-white")}
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </Button>
            </div>
            <div className="w-28">
              <SearchableSelect
                placeholder="10 / page"
                value={String(limit)}
                onChange={(v) => {
                  if (!v) return;
                  setLimit(Number(v));
                }}
                allowClear={false}
                options={[
                  { value: "10", label: "10 / page" },
                  { value: "25", label: "25 / page" },
                  { value: "50", label: "50 / page" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <DesignationDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        designationOptions={(allDesignations ?? []).filter((d) => d.id !== editing?.id)}
      />
    </div>
  );
}
