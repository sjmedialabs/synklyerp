"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AccountDetailPanel } from "@/modules/finance/components/account-detail-panel";
import {
  useChartOfAccountMutations,
  useChartOfAccountsList,
  useCoaFilterOptions,
  useCoaParentOptions,
} from "@/hooks/finance/masters";
import type { ChartOfAccount } from "@/lib/mappers/finance-masters";
import { cn } from "@/lib/utils";

function getVisibleAccounts(items: ChartOfAccount[], expanded: Set<string>) {
  const byId = new Map(items.map((i) => [i.id, i]));

  const isVisible = (item: ChartOfAccount): boolean => {
    if (!item.parentId) return true;
    let current = byId.get(item.parentId);
    while (current) {
      if (!expanded.has(current.id)) return false;
      if (!current.parentId) return true;
      current = byId.get(current.parentId);
    }
    return true;
  };

  return items.filter(isVisible);
}

export default function ChartOfAccountsPage() {
  const [search, setSearch] = useState("");
  const [accountGroupId, setAccountGroupId] = useState("");
  const [accountType, setAccountType] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<ChartOfAccount | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useChartOfAccountsList({
    page,
    limit: 500,
    search: search || undefined,
    accountGroupId: accountGroupId || undefined,
    accountType: accountType || undefined,
    status: status || undefined,
  });

  const { data: filterOptions } = useCoaFilterOptions();
  const { data: parentOptions = [] } = useCoaParentOptions();
  const { create, update, remove } = useChartOfAccountMutations();

  const allItems = data?.items ?? [];
  const visibleItems = useMemo(() => getVisibleAccounts(allItems, expanded), [allItems, expanded]);

  const pagedItems = useMemo(() => {
    const from = (page - 1) * limit;
    return visibleItems.slice(from, from + limit);
  }, [visibleItems, page, limit]);

  const total = visibleItems.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  useEffect(() => {
    setPage(1);
  }, [search, accountGroupId, accountType, status, limit]);

  useEffect(() => {
    const roots = allItems.filter((i) => i.childCount > 0).map((i) => i.id);
    setExpanded(new Set(roots));
  }, [allItems]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (accountGroupId) qs.set("accountGroupId", accountGroupId);
    if (accountType) qs.set("accountType", accountType);
    if (status) qs.set("status", status);
    window.location.href = `/api/finance/chart-of-accounts/export?${qs.toString()}`;
  };

  const handleNewAccount = () => {
    setCreating(true);
    setSelected({
      id: "",
      tenantId: "",
      parentId: null,
      accountCode: "",
      accountName: "",
      description: null,
      accountGroupId: null,
      accountGroupName: null,
      accountType: "Posting",
      accountCategory: "Assets",
      currency: "INR",
      allowManualEntry: true,
      isActive: true,
      costCenterApplicable: false,
      budgetControl: false,
      balanceSheetClassification: null,
      profitLossClassification: null,
      taxCategory: null,
      vatGstApplicable: "No",
      level: 0,
      sortOrder: 0,
      createdBy: null,
      updatedBy: null,
      createdByName: null,
      updatedByName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      childCount: 0,
    });
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    try {
      if (creating || !selected?.id) {
        await create.mutateAsync(formData);
        toast.success("Account created");
      } else {
        await update.mutateAsync({ id: selected.id, ...formData });
        toast.success("Account updated");
      }
      setCreating(false);
      setSelected(null);
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  const handleDelete = async (account: ChartOfAccount) => {
    if (!confirm(`Delete account "${account.accountName}"?`)) return;
    try {
      await remove.mutateAsync(account.id);
      toast.success("Account deleted");
      if (selected?.id === account.id) setSelected(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const accountGroups = filterOptions?.accountGroups ?? [];

  return (
    <div className={cn("flex gap-0", selected && "items-stretch")}>
      <div className={cn("min-w-0 flex-1", selected && "pr-0")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Chart of Accounts</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5">
              <Upload size={14} /> Import
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
            <Button
              type="button"
              size="sm"
              className="h-10 gap-1.5 bg-slate-900 text-white hover:bg-slate-800"
              onClick={handleNewAccount}
            >
              <Plus size={14} /> New Account
            </Button>
          </div>
        </div>

        <div className="mb-4 hidden sm:flex sm:items-center sm:gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Input
              type="search"
              placeholder="Search by account code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="min-w-[140px]">
            <SearchableSelect
              placeholder="Account Group"
              value={accountGroupId || null}
              onChange={(v) => setAccountGroupId(v ?? "")}
              clearLabel="All"
              options={accountGroups.map((g) => ({ value: g.id, label: g.name }))}
            />
          </div>
          <div className="min-w-[130px]">
            <SearchableSelect
              placeholder="Account Type"
              value={accountType || null}
              onChange={(v) => setAccountType(v ?? "")}
              clearLabel="All"
              options={(filterOptions?.accountTypes ?? []).map((t) => ({ value: t, label: t }))}
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
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" aria-label="Select all" />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-slate-600">Account Code</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-600">Account Name</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-600">Account Group</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-600">Account Type</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-3 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-500">
                      No accounts found. Create your first account to get started.
                    </td>
                  </tr>
                ) : (
                  pagedItems.map((account) => (
                    <tr
                      key={account.id}
                      className={cn(
                        "border-t border-slate-100 hover:bg-slate-50/50",
                        selected?.id === account.id && "bg-indigo-50/40"
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={checked.has(account.id)}
                          onChange={() => {
                            setChecked((prev) => {
                              const next = new Set(prev);
                              if (next.has(account.id)) next.delete(account.id);
                              else next.add(account.id);
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        <div
                          className="flex items-center gap-1"
                          style={{ paddingLeft: `${account.level * 16}px` }}
                        >
                          {account.childCount > 0 ? (
                            <button
                              type="button"
                              className="rounded p-0.5 text-slate-500 hover:bg-slate-100"
                              onClick={() => toggleExpand(account.id)}
                            >
                              {expanded.has(account.id) ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronRight size={14} />
                              )}
                            </button>
                          ) : (
                            <span className="w-5" />
                          )}
                          {account.accountCode}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{account.accountName}</td>
                      <td className="px-3 py-3 text-slate-600">{account.accountGroupName ?? "—"}</td>
                      <td className="px-3 py-3 text-slate-600">{account.accountType}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            account.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {account.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                            onClick={() => {
                              setCreating(false);
                              setSelected(account);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => handleDelete(account)}
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
                {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map((n) => (
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
                  onChange={(v) => v && setLimit(Number(v))}
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
      </div>

      {selected && (
        <AccountDetailPanel
          account={selected}
          accountGroups={accountGroups}
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
  );
}
