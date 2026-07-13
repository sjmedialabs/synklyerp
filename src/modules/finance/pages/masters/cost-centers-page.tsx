"use client";

import { useEffect, useState } from "react";
import { Filter, Loader2, MoreVertical, Pencil, Plus, Settings, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CostCenterDetailPanel } from "@/modules/finance/components/cost-center-detail-panel";
import { MastersSummaryCards } from "@/modules/finance/components/masters-summary-cards";
import { MastersTableFooter } from "@/modules/finance/components/masters-table-footer";
import {
  useCostCenterMutations,
  useCostCenterParentOptions,
  useCostCenterStats,
  useCostCentersList,
} from "@/hooks/finance/masters";
import type { CostCenter } from "@/lib/mappers/finance-masters";
import { COST_CENTER_TYPES } from "@/validators/finance-masters";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const emptyCostCenter = (): CostCenter => ({
  id: "",
  tenantId: "",
  parentId: null,
  parentCode: null,
  parentName: null,
  costCenterCode: "",
  costCenterName: "",
  costCenterType: "Administrative",
  managerName: null,
  location: null,
  description: null,
  status: "ACTIVE",
  budgetAmount: 0,
  currency: "INR",
  allowManualEntry: true,
  includeInBudget: true,
  allowTransactions: true,
  isBillable: false,
  level: 0,
  createdBy: null,
  updatedBy: null,
  createdByName: null,
  updatedByName: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function CostCentersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [costCenterType, setCostCenterType] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<CostCenter | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: stats } = useCostCenterStats();
  const { data, isLoading, error } = useCostCentersList({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    costCenterType: costCenterType || undefined,
  });
  const { data: parentOptions = [] } = useCostCenterParentOptions();
  const { create, update, remove } = useCostCenterMutations();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 };
  const total = meta.total;
  const totalPages = meta.totalPages;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const activePct = stats?.total ? ((stats.active / stats.total) * 100).toFixed(2) : "0";
  const inactivePct = stats?.total ? ((stats.inactive / stats.total) * 100).toFixed(2) : "0";

  useEffect(() => setPage(1), [search, status, costCenterType, limit]);

  const handleExport = () => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (status) qs.set("status", status);
    if (costCenterType) qs.set("costCenterType", costCenterType);
    window.location.href = `/api/finance/cost-centers/export?${qs.toString()}`;
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    try {
      if (creating || !selected?.id) {
        await create.mutateAsync(formData);
        toast.success("Cost center created");
      } else {
        await update.mutateAsync({ id: selected.id, ...formData });
        toast.success("Cost center updated");
      }
      setCreating(false);
      setSelected(null);
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  const handleDelete = async (cc: CostCenter) => {
    if (!confirm(`Delete cost center "${cc.costCenterName}"?`)) return;
    try {
      await remove.mutateAsync(cc.id);
      toast.success("Cost center deleted");
      if (selected?.id === cc.id) setSelected(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Cost Centers</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage cost centers to track and analyze costs by department, function, or location.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5">
          <Settings size={14} /> Cost Center Settings
        </Button>
      </div>

      <MastersSummaryCards
        cards={[
          { label: "Total Cost Centers", value: stats?.total ?? 0 },
          {
            label: "Active Cost Centers",
            value: stats?.active ?? 0,
            sublabel: `${activePct}% Active`,
          },
          {
            label: "Inactive Cost Centers",
            value: stats?.inactive ?? 0,
            sublabel: `${inactivePct}% Inactive`,
          },
          {
            label: "Total Budget (FY 2024-25)",
            value: formatCurrency(stats?.totalBudget ?? 0),
          },
        ]}
      />

      <div className={cn("flex gap-0", selected && "items-stretch")}>
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5">
              <Upload size={14} /> Import
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5" onClick={handleExport}>
              <Upload size={14} /> Export
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-10 gap-1.5 bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => {
                setCreating(true);
                setSelected(emptyCostCenter());
              }}
            >
              <Plus size={14} /> New Cost Center
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Input
                type="search"
                placeholder="Search by code or name..."
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
            <div className="min-w-[150px]">
              <SearchableSelect
                placeholder="Cost Center Type"
                value={costCenterType || null}
                onChange={(v) => setCostCenterType(v ?? "")}
                clearLabel="All"
                options={COST_CENTER_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </div>
            <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5">
              <Filter size={14} /> Filters
            </Button>
          </div>

          {isLoading && (
            <div className="flex justify-center py-10">
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
                      <input type="checkbox" aria-label="Select all" />
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Cost Center Code</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Cost Center Name</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Type</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Parent Cost Center</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Manager</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Budget (FY)</th>
                    <th className="px-3 py-3 text-right font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-500">
                        No cost centers found. Create your first cost center to get started.
                      </td>
                    </tr>
                  ) : (
                    items.map((cc) => (
                      <tr
                        key={cc.id}
                        className={cn(
                          "cursor-pointer border-t border-slate-100 hover:bg-slate-50/50",
                          selected?.id === cc.id && "bg-indigo-50/40"
                        )}
                        onClick={() => {
                          setCreating(false);
                          setSelected(cc);
                        }}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" aria-label={`Select ${cc.costCenterName}`} />
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">{cc.costCenterCode}</td>
                        <td className="px-3 py-3 text-slate-700">{cc.costCenterName}</td>
                        <td className="px-3 py-3 text-slate-600">{cc.costCenterType}</td>
                        <td className="px-3 py-3 text-slate-600">
                          {cc.parentCode ? `${cc.parentCode} - ${cc.parentName}` : "—"}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{cc.managerName ?? "—"}</td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                              cc.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            )}
                          >
                            {cc.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {formatCurrency(cc.budgetAmount)}
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                              onClick={() => {
                                setCreating(false);
                                setSelected(cc);
                              }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => handleDelete(cc)}
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
          <CostCenterDetailPanel
            costCenter={selected}
            parentOptions={parentOptions}
            onClose={() => {
              setSelected(null);
              setCreating(false);
            }}
            onSave={handleSave}
            saving={create.isPending || update.isPending}
          />
        )}
      </div>
    </div>
  );
}
