"use client";

import { useEffect, useState } from "react";
import { Filter, Loader2, MoreVertical, Pencil, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AccountGroupDetailPanel } from "@/modules/finance/components/account-group-detail-panel";
import { MastersSummaryCards } from "@/modules/finance/components/masters-summary-cards";
import { MastersTableFooter } from "@/modules/finance/components/masters-table-footer";
import {
  useAccountGroupMutations,
  useAccountGroupParentOptions,
  useAccountGroupStats,
  useAccountGroupsList,
} from "@/hooks/finance/masters";
import type { AccountGroup } from "@/lib/mappers/finance-masters";
import { GROUP_TYPES } from "@/validators/finance-masters";
import { cn } from "@/lib/utils";

const emptyGroup = (): AccountGroup => ({
  id: "",
  tenantId: "",
  parentId: null,
  parentCode: null,
  parentName: null,
  code: "",
  name: "",
  description: null,
  groupType: "Group",
  status: "ACTIVE",
  allowManualMapping: true,
  budgetApplicable: true,
  showInReports: true,
  costCenterApplicable: true,
  profitCenterApplicable: false,
  level: 0,
  accountCount: 0,
  createdBy: null,
  updatedBy: null,
  createdByName: null,
  updatedByName: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function AccountGroupsPage() {
  const [search, setSearch] = useState("");
  const [groupType, setGroupType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<AccountGroup | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: stats } = useAccountGroupStats();
  const { data, isLoading, error } = useAccountGroupsList({
    page,
    limit,
    search: search || undefined,
    groupType: groupType || undefined,
    status: status || undefined,
  });
  const { data: parentOptions = [] } = useAccountGroupParentOptions();
  const { create, update, remove } = useAccountGroupMutations();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 };
  const total = meta.total;
  const totalPages = meta.totalPages;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  useEffect(() => setPage(1), [search, groupType, status, limit]);

  const handleExport = () => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (groupType) qs.set("groupType", groupType);
    if (status) qs.set("status", status);
    window.location.href = `/api/finance/account-groups/export?${qs.toString()}`;
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    try {
      if (creating || !selected?.id) {
        await create.mutateAsync(formData);
        toast.success("Account group created");
      } else {
        await update.mutateAsync({ id: selected.id, ...formData });
        toast.success("Account group updated");
      }
      setCreating(false);
      setSelected(null);
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  const handleDelete = async (group: AccountGroup) => {
    if (!confirm(`Delete group "${group.name}"?`)) return;
    try {
      await remove.mutateAsync(group.id);
      toast.success("Account group deleted");
      if (selected?.id === group.id) setSelected(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <MastersSummaryCards
        cards={[
          { label: "Total Groups", value: stats?.total ?? 0 },
          { label: "Active Groups", value: stats?.active ?? 0 },
          { label: "Inactive Groups", value: stats?.inactive ?? 0 },
          { label: "Total Accounts Mapped", value: stats?.mappedAccounts ?? 0 },
        ]}
      />

      <div className={cn("flex gap-0", selected && "items-stretch")}>
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Account Groups</h2>
            <div className="flex flex-wrap items-center gap-2">
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
                  setSelected(emptyGroup());
                }}
              >
                <Plus size={14} /> New Group
              </Button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Input
                type="search"
                placeholder="Search by group code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="min-w-[130px]">
              <SearchableSelect
                placeholder="Group Type"
                value={groupType || null}
                onChange={(v) => setGroupType(v ?? "")}
                clearLabel="All"
                options={GROUP_TYPES.map((t) => ({ value: t, label: t }))}
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
              <table className="w-full min-w-[800px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <input type="checkbox" aria-label="Select all" />
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Group Code</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Group Name</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Group Type</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Parent Group</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-600">Accounts</th>
                    <th className="px-3 py-3 text-right font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-500">
                        No account groups found. Create your first group to get started.
                      </td>
                    </tr>
                  ) : (
                    items.map((group) => (
                      <tr
                        key={group.id}
                        className={cn(
                          "cursor-pointer border-t border-slate-100 hover:bg-slate-50/50",
                          selected?.id === group.id && "bg-indigo-50/40"
                        )}
                        onClick={() => {
                          setCreating(false);
                          setSelected(group);
                        }}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" aria-label={`Select ${group.name}`} />
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">{group.code}</td>
                        <td className="px-3 py-3 text-slate-700">{group.name}</td>
                        <td className="px-3 py-3 text-slate-600">{group.groupType}</td>
                        <td className="px-3 py-3 text-slate-600">
                          {group.parentCode ? `${group.parentCode} - ${group.parentName}` : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                              group.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            )}
                          >
                            {group.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{group.accountCount}</td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                              onClick={() => {
                                setCreating(false);
                                setSelected(group);
                              }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => handleDelete(group)}
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
          <AccountGroupDetailPanel
            group={selected}
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
