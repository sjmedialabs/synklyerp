"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { CostCenter } from "@/lib/mappers/finance-masters";
import { COST_CENTER_TYPES } from "@/validators/finance-masters";
import { Input, Label } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  costCenter: CostCenter | null;
  parentOptions: { id: string; costCenterCode: string; costCenterName: string }[];
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving?: boolean;
};

const TABS = ["General", "Budget", "Users", "Notes", "Attachments"] as const;

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function CostCenterDetailPanel({
  costCenter,
  parentOptions,
  onClose,
  onSave,
  saving,
}: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!costCenter) return;
    setForm({
      parentId: costCenter.parentId,
      costCenterCode: costCenter.costCenterCode,
      costCenterName: costCenter.costCenterName,
      costCenterType: costCenter.costCenterType,
      managerName: costCenter.managerName ?? "",
      location: costCenter.location ?? "",
      description: costCenter.description ?? "",
      status: costCenter.status,
      budgetAmount: costCenter.budgetAmount,
      currency: costCenter.currency,
      allowManualEntry: costCenter.allowManualEntry,
      includeInBudget: costCenter.includeInBudget,
      allowTransactions: costCenter.allowTransactions,
      isBillable: costCenter.isBillable,
    });
    setTab("General");
  }, [costCenter]);

  if (!costCenter) return null;

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cost Center Details</h2>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
              costCenter.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}
          >
            {costCenter.status === "ACTIVE" ? "Active" : "Inactive"}
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
              <Label>Cost Center Code *</Label>
              <Input
                value={String(form.costCenterCode ?? "")}
                onChange={(e) => set("costCenterCode", e.target.value)}
              />
            </div>
            <div>
              <Label>Cost Center Name *</Label>
              <Input
                value={String(form.costCenterName ?? "")}
                onChange={(e) => set("costCenterName", e.target.value)}
              />
            </div>
            <div>
              <Label>Parent Cost Center</Label>
              <SearchableSelect
                placeholder="Select parent"
                value={(form.parentId as string | null) ?? null}
                onChange={(v) => set("parentId", v)}
                options={parentOptions
                  .filter((p) => p.id !== costCenter.id)
                  .map((p) => ({
                    value: p.id,
                    label: `${p.costCenterCode} - ${p.costCenterName}`,
                  }))}
              />
            </div>
            <div>
              <Label>Cost Center Type *</Label>
              <SearchableSelect
                placeholder="Select type"
                value={String(form.costCenterType ?? "Administrative")}
                onChange={(v) => set("costCenterType", v)}
                allowClear={false}
                options={COST_CENTER_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </div>
            <div>
              <Label>Manager</Label>
              <Input
                value={String(form.managerName ?? "")}
                onChange={(e) => set("managerName", e.target.value)}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={String(form.location ?? "")} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                value={String(form.description ?? "")}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <SearchableSelect
                placeholder="Status"
                value={String(form.status ?? "ACTIVE")}
                onChange={(v) => set("status", v)}
                allowClear={false}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                ]}
              />
            </div>
          </div>
        )}

        {tab === "Budget" && (
          <div className="space-y-4">
            <div>
              <Label>Budget (FY 2024-25)</Label>
              <Input
                type="number"
                value={String(form.budgetAmount ?? 0)}
                onChange={(e) => set("budgetAmount", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <SearchableSelect
                placeholder="Currency"
                value={String(form.currency ?? "INR")}
                onChange={(v) => set("currency", v)}
                allowClear={false}
                options={[
                  { value: "INR", label: "INR - Indian Rupee" },
                  { value: "USD", label: "USD - US Dollar" },
                  { value: "EUR", label: "EUR - Euro" },
                ]}
              />
            </div>
            <div className="space-y-2">
              {(
                [
                  ["allowManualEntry", "Allow Manual Entry"],
                  ["includeInBudget", "Include in Budget"],
                  ["allowTransactions", "Allow Transactions"],
                  ["isBillable", "Cost Center is Billable"],
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
          </div>
        )}

        {(tab === "Users" || tab === "Notes" || tab === "Attachments") && (
          <p className="text-sm text-slate-500">Coming soon.</p>
        )}
      </div>

      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        {costCenter.id && (
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <p>Created By</p>
              <p className="font-medium text-slate-700">{costCenter.createdByName ?? "—"}</p>
            </div>
            <div>
              <p>Last Updated By</p>
              <p className="font-medium text-slate-700">{costCenter.updatedByName ?? "—"}</p>
            </div>
            <div>
              <p>Created On</p>
              <p className="font-medium text-slate-700">{formatDateTime(costCenter.createdAt)}</p>
            </div>
            <div>
              <p>Last Updated On</p>
              <p className="font-medium text-slate-700">{formatDateTime(costCenter.updatedAt)}</p>
            </div>
          </div>
        )}
        <Button type="button" className="w-full" disabled={saving} onClick={() => onSave(form)}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </aside>
  );
}
