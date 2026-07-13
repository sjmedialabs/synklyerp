"use client";

import { useEffect, useState } from "react";
import { Loader2, MoreVertical, Pencil, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FinancialDimensionDetailPanel } from "@/modules/finance/components/financial-dimension-detail-panel";
import { MastersSummaryCards } from "@/modules/finance/components/masters-summary-cards";
import { MastersTableFooter } from "@/modules/finance/components/masters-table-footer";
import {
  useFinancialDimensionMutations,
  useFinancialDimensionStats,
  useFinancialDimensionsList,
} from "@/hooks/finance/masters";
import type { FinancialDimension } from "@/lib/mappers/finance-masters";
import { cn } from "@/lib/utils";

const emptyDimension = (): FinancialDimension => ({
  id: "",
  tenantId: "",
  dimensionCode: "",
  dimensionName: "",
  description: null,
  dataType: "List",
  allowMultipleValues: false,
  isActive: true,
  valueCount: 0,
  createdBy: null,
  updatedBy: null,
  createdByName: null,
  updatedByName: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function FinancialDimensionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<FinancialDimension | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: stats } = useFinancialDimensionStats();
  const { data, isLoading, error } = useFinancialDimensionsList({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
  });
  const { create, update, remove, createValue } = useFinancialDimensionMutations();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 };
  const total = meta.total;
  const totalPages = meta.totalPages;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const activePct = stats?.total ? ((stats.active / stats.total) * 100).toFixed(2) : "0";
  const inactivePct = stats?.total ? ((stats.inactive / stats.total) * 100).toFixed(2) : "0";

  useEffect(() => setPage(1), [search, status, limit]);

  const handleSave = async (formData: Record<string, unknown>) => {
    try {
      if (creating || !selected?.id) {
        await create.mutateAsync(formData);
        toast.success("Dimension created");
      } else {
        await update.mutateAsync({ id: selected.id, ...formData });
        toast.success("Dimension updated");
      }
      setCreating(false);
      setSelected(null);
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  const handleAddValue = async (valueData: Record<string, unknown>) => {
    if (!selected?.id) return;
    try {
      await createValue.mutateAsync({ dimensionId: selected.id, ...valueData });
      toast.success("Value added");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (dim: FinancialDimension) => {
    if (!confirm(`Delete dimension "${dim.dimensionName}"?`)) return;
    try {
      await remove.mutateAsync(dim.id);
      toast.success("Dimension deleted");
      if (selected?.id === dim.id) setSelected(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <MastersSummaryCards
        cards={[
          { label: "Total Dimensions", value: stats?.total ?? 0, sublabel: "All Dimensions" },
          {
            label: "Active Dimensions",
            value: stats?.active ?? 0,
            sublabel: `${activePct}% Active`,
          },
          {
            label: "Inactive Dimensions",
            value: stats?.inactive ?? 0,
            sublabel: `${inactivePct}% Inactive`,
          },
          {
            label: "Total Values",
            value: stats?.totalValues ?? 0,
            sublabel: "Across all dimensions",
          },
        ]}
      />

      <div className={cn("flex gap-0", selected && "items-stretch")}>
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Financial Dimensions</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5">
                <Upload size={14} /> Import
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5">
                <Upload size={14} /> Export
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-10 gap-1.5 bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => {
                  setCreating(true);
                  setSelected(emptyDimension());
                }}
              >
                <Plus size={14} /> New Dimension
              </Button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Input
                type="search"
                placeholder="Search by dimension name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="min-w-[120px]">
              <SearchableSelect
                placeholder="Status"
                value={status || null}
                onChange={(v) => setStatus(v ?? "")}
                clearLabel="All"
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                ]}
              />
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          )}
          {error && <p className="mb-4 text-sm text-rose-600">{(error as Error).message}</p>}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <input type="checkbox" aria-label="Select all" />
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Dimension Code</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Dimension Name</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Description</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Values</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-3 py-3 text-right font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-500">
                        No dimensions found. Create your first dimension to get started.
                      </td>
                    </tr>
                  ) : (
                    items.map((dim) => (
                      <tr
                        key={dim.id}
                        className={cn(
                          "cursor-pointer border-t border-slate-100 hover:bg-slate-50/50",
                          selected?.id === dim.id && "bg-indigo-50/40"
                        )}
                        onClick={() => {
                          setCreating(false);
                          setSelected(dim);
                        }}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" aria-label={`Select ${dim.dimensionName}`} />
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">{dim.dimensionCode}</td>
                        <td className="px-3 py-3 text-slate-700">{dim.dimensionName}</td>
                        <td className="max-w-[200px] truncate px-3 py-3 text-slate-600">
                          {dim.description ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{dim.valueCount}</td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                              dim.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            )}
                          >
                            {dim.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                              onClick={() => {
                                setCreating(false);
                                setSelected(dim);
                              }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => handleDelete(dim)}
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <MastersTableFooter
              from={from}
              to={to}
              total={total}
              page={page}
              totalPages={totalPages}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </div>
        </div>

        {selected && (
          <FinancialDimensionDetailPanel
            dimension={selected}
            onClose={() => {
              setSelected(null);
              setCreating(false);
            }}
            onSave={handleSave}
            onAddValue={handleAddValue}
            saving={create.isPending || update.isPending}
          />
        )}
      </div>
    </div>
  );
}
