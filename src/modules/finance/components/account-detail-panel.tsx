"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { ChartOfAccount } from "@/lib/mappers/finance-masters";
import {
  ACCOUNT_CATEGORIES,
  ACCOUNT_TYPES,
  VAT_GST_OPTIONS,
} from "@/validators/finance-masters";
import { Input, Label } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  account: ChartOfAccount | null;
  accountGroups: { id: string; name: string }[];
  parentOptions: { id: string; accountCode: string; accountName: string }[];
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving?: boolean;
};

const TABS = ["General", "Hierarchy", "Settings", "Balances", "Notes", "Attachments"] as const;

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AccountDetailPanel({
  account,
  accountGroups,
  parentOptions,
  onClose,
  onSave,
  saving,
}: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!account) return;
    setForm({
      parentId: account.parentId,
      accountCode: account.accountCode,
      accountName: account.accountName,
      description: account.description ?? "",
      accountGroupId: account.accountGroupId,
      accountType: account.accountType,
      accountCategory: account.accountCategory,
      currency: account.currency,
      allowManualEntry: account.allowManualEntry,
      isActive: account.isActive,
      costCenterApplicable: account.costCenterApplicable,
      budgetControl: account.budgetControl,
      balanceSheetClassification: account.balanceSheetClassification ?? "",
      profitLossClassification: account.profitLossClassification ?? "",
      taxCategory: account.taxCategory ?? "",
      vatGstApplicable: account.vatGstApplicable,
    });
    setTab("General");
  }, [account]);

  if (!account) return null;

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    await onSave(form);
  };

  return (
    <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account Details</h2>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
              account.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            )}
          >
            {account.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 py-2 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium",
              tab === t
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "General" && (
          <div className="space-y-4">
            <div>
              <Label>Account Code</Label>
              <Input value={String(form.accountCode ?? "")} onChange={(e) => set("accountCode", e.target.value)} />
            </div>
            <div>
              <Label>Account Name</Label>
              <Input value={String(form.accountName ?? "")} onChange={(e) => set("accountName", e.target.value)} />
            </div>
            <div>
              <Label>Account Group</Label>
              <SearchableSelect
                placeholder="Select group"
                value={(form.accountGroupId as string | null) ?? null}
                onChange={(v) => set("accountGroupId", v)}
                options={accountGroups.map((g) => ({ value: g.id, label: g.name }))}
              />
            </div>
            <div>
              <Label>Account Type</Label>
              <SearchableSelect
                placeholder="Select type"
                value={String(form.accountType ?? "Posting")}
                onChange={(v) => set("accountType", v)}
                allowClear={false}
                options={ACCOUNT_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </div>
            <div>
              <Label>Account Category</Label>
              <SearchableSelect
                placeholder="Select category"
                value={(form.accountCategory as string | null) ?? null}
                onChange={(v) => set("accountCategory", v)}
                options={ACCOUNT_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={String(form.currency ?? "INR")} onChange={(e) => set("currency", e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={String(form.description ?? "")}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              {(
                [
                  ["allowManualEntry", "Allow Manual Entry"],
                  ["isActive", "Active"],
                  ["costCenterApplicable", "Cost Center Applicable"],
                  ["budgetControl", "Budget Control"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key])}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Financial Classification
              </h3>
              <div className="space-y-3">
                <div>
                  <Label>Balance Sheet</Label>
                  <Input
                    value={String(form.balanceSheetClassification ?? "")}
                    onChange={(e) => set("balanceSheetClassification", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Profit & Loss</Label>
                  <Input
                    value={String(form.profitLossClassification ?? "")}
                    onChange={(e) => set("profitLossClassification", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tax Category</Label>
                  <Input
                    value={String(form.taxCategory ?? "")}
                    onChange={(e) => set("taxCategory", e.target.value)}
                  />
                </div>
                <div>
                  <Label>VAT/GST Applicable</Label>
                  <SearchableSelect
                    placeholder="Select"
                    value={String(form.vatGstApplicable ?? "No")}
                    onChange={(v) => set("vatGstApplicable", v)}
                    allowClear={false}
                    options={VAT_GST_OPTIONS.map((o) => ({ value: o, label: o }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Hierarchy" && (
          <div className="space-y-4">
            <div>
              <Label>Parent Account</Label>
              <SearchableSelect
                placeholder="None (root level)"
                value={(form.parentId as string | null) ?? null}
                onChange={(v) => set("parentId", v)}
                options={parentOptions
                  .filter((p) => p.id !== account.id)
                  .map((p) => ({
                    value: p.id,
                    label: `${p.accountCode} — ${p.accountName}`,
                  }))}
              />
            </div>
            <p className="text-sm text-slate-500">
              Level {account.level} · {account.childCount} direct child account
              {account.childCount === 1 ? "" : "s"}
            </p>
          </div>
        )}

        {tab !== "General" && tab !== "Hierarchy" && (
          <p className="text-sm text-slate-500">
            {tab} will be available when related finance transactions are configured.
          </p>
        )}
      </div>

      <div className="space-y-3 border-t border-slate-100 px-4 py-4 text-xs text-slate-500 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">Created By</p>
            <p>{account.createdByName ?? "—"}</p>
            <p>{formatDateTime(account.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">Last Updated By</p>
            <p>{account.updatedByName ?? "—"}</p>
            <p>{formatDateTime(account.updatedAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={saving}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </aside>
  );
}
