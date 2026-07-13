"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { AccountGroup } from "@/lib/mappers/finance-masters";
import { GROUP_TYPES } from "@/validators/finance-masters";
import { Input, Label } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  group: AccountGroup | null;
  parentOptions: { id: string; code: string; name: string }[];
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving?: boolean;
};

const TABS = ["General", "Settings", "Mapped Accounts", "Notes", "Attachments"] as const;

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AccountGroupDetailPanel({ group, parentOptions, onClose, onSave, saving }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!group) return;
    setForm({
      parentId: group.parentId,
      code: group.code,
      name: group.name,
      description: group.description ?? "",
      groupType: group.groupType,
      status: group.status,
      allowManualMapping: group.allowManualMapping,
      budgetApplicable: group.budgetApplicable,
      showInReports: group.showInReports,
      costCenterApplicable: group.costCenterApplicable,
      profitCenterApplicable: group.profitCenterApplicable,
    });
    setTab("General");
  }, [group]);

  if (!group) return null;

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Group Details</h2>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
              group.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            )}
          >
            {group.status === "ACTIVE" ? "Active" : "Inactive"}
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
              <Label>Group Code *</Label>
              <Input value={String(form.code ?? "")} onChange={(e) => set("code", e.target.value)} />
            </div>
            <div>
              <Label>Group Name *</Label>
              <Input value={String(form.name ?? "")} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label>Parent Group</Label>
              <SearchableSelect
                placeholder="Select parent"
                value={(form.parentId as string | null) ?? null}
                onChange={(v) => set("parentId", v)}
                options={parentOptions
                  .filter((p) => p.id !== group.id)
                  .map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
              />
            </div>
            <div>
              <Label>Group Type *</Label>
              <SearchableSelect
                placeholder="Select type"
                value={String(form.groupType ?? "Group")}
                onChange={(v) => set("groupType", v)}
                allowClear={false}
                options={GROUP_TYPES.map((t) => ({ value: t, label: t }))}
              />
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

        {tab === "Settings" && (
          <div className="space-y-2">
            {(
              [
                ["allowManualMapping", "Allow Manual Mapping"],
                ["budgetApplicable", "Budget Applicable"],
                ["showInReports", "Show in Reports"],
                ["costCenterApplicable", "Cost Center Applicable"],
                ["profitCenterApplicable", "Profit Center Applicable"],
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
        )}

        {tab === "Mapped Accounts" && (
          <p className="text-sm text-slate-500">
            {group.accountCount} account{group.accountCount !== 1 ? "s" : ""} mapped to this group.
          </p>
        )}

        {(tab === "Notes" || tab === "Attachments") && (
          <p className="text-sm text-slate-500">Coming soon.</p>
        )}
      </div>

      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        {group.id && (
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <p>Created By</p>
              <p className="font-medium text-slate-700">{group.createdByName ?? "—"}</p>
            </div>
            <div>
              <p>Last Updated By</p>
              <p className="font-medium text-slate-700">{group.updatedByName ?? "—"}</p>
            </div>
            <div>
              <p>Created On</p>
              <p className="font-medium text-slate-700">{formatDateTime(group.createdAt)}</p>
            </div>
            <div>
              <p>Last Updated On</p>
              <p className="font-medium text-slate-700">{formatDateTime(group.updatedAt)}</p>
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
