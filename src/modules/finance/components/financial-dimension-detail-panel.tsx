"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { FinancialDimension } from "@/lib/mappers/finance-masters";
import { DIMENSION_DATA_TYPES } from "@/validators/finance-masters";
import { Input, Label } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDimensionValues } from "@/hooks/finance/masters";

type Props = {
  dimension: FinancialDimension | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onAddValue?: (data: Record<string, unknown>) => Promise<void>;
  saving?: boolean;
};

const TABS = ["General", "Values", "Settings", "Users", "Notes", "Attachments"] as const;

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function FinancialDimensionDetailPanel({
  dimension,
  onClose,
  onSave,
  onAddValue,
  saving,
}: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [newValue, setNewValue] = useState({ valueCode: "", valueName: "" });

  const { data: values = [] } = useDimensionValues(dimension?.id || null);

  useEffect(() => {
    if (!dimension) return;
    setForm({
      dimensionCode: dimension.dimensionCode,
      dimensionName: dimension.dimensionName,
      description: dimension.description ?? "",
      dataType: dimension.dataType,
      allowMultipleValues: dimension.allowMultipleValues,
      isActive: dimension.isActive,
    });
    setTab("General");
  }, [dimension]);

  if (!dimension) return null;

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const tabs = TABS.map((t) =>
    t === "Values" ? `Values (${values.length})` : t
  ) as string[];

  return (
    <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dimension Details</h2>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
              dimension.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}
          >
            {dimension.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 py-2 dark:border-slate-800">
        {tabs.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setTab(TABS[i])}
            className={cn(
              "whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium",
              tab === TABS[i]
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "General" && (
          <div className="space-y-4">
            <div>
              <Label>Dimension Code *</Label>
              <Input
                value={String(form.dimensionCode ?? "")}
                onChange={(e) => set("dimensionCode", e.target.value)}
              />
            </div>
            <div>
              <Label>Dimension Name *</Label>
              <Input
                value={String(form.dimensionName ?? "")}
                onChange={(e) => set("dimensionName", e.target.value)}
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
              <Label>Data Type *</Label>
              <SearchableSelect
                placeholder="Select data type"
                value={String(form.dataType ?? "List")}
                onChange={(v) => set("dataType", v)}
                allowClear={false}
                options={DIMENSION_DATA_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </div>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Allow Multiple Values</span>
              <input
                type="checkbox"
                checked={Boolean(form.allowMultipleValues)}
                onChange={(e) => set("allowMultipleValues", e.target.checked)}
              />
            </label>
            <div>
              <Label>Status</Label>
              <SearchableSelect
                placeholder="Status"
                value={form.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(v) => set("isActive", v === "ACTIVE")}
                allowClear={false}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                ]}
              />
            </div>
          </div>
        )}

        {tab === "Values" && (
          <div className="space-y-4">
            {values.length === 0 ? (
              <p className="text-sm text-slate-500">No values defined yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {values.map((v) => (
                  <li key={v.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{v.valueCode}</span> — {v.valueName}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        v.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {v.isActive ? "Active" : "Inactive"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {dimension.id && onAddValue && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-500">Add Value</p>
                <Input
                  placeholder="Value Code"
                  value={newValue.valueCode}
                  onChange={(e) => setNewValue((p) => ({ ...p, valueCode: e.target.value }))}
                />
                <Input
                  placeholder="Value Name"
                  value={newValue.valueName}
                  onChange={(e) => setNewValue((p) => ({ ...p, valueName: e.target.value }))}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!newValue.valueCode || !newValue.valueName) return;
                    await onAddValue(newValue);
                    setNewValue({ valueCode: "", valueName: "" });
                  }}
                >
                  Add Value
                </Button>
              </div>
            )}
          </div>
        )}

        {(tab === "Settings" || tab === "Users" || tab === "Notes" || tab === "Attachments") && (
          <p className="text-sm text-slate-500">Coming soon.</p>
        )}
      </div>

      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        {dimension.id && (
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <p>Created By</p>
              <p className="font-medium text-slate-700">{dimension.createdByName ?? "—"}</p>
            </div>
            <div>
              <p>Last Updated By</p>
              <p className="font-medium text-slate-700">{dimension.updatedByName ?? "—"}</p>
            </div>
            <div>
              <p>Created On</p>
              <p className="font-medium text-slate-700">{formatDateTime(dimension.createdAt)}</p>
            </div>
            <div>
              <p>Last Updated On</p>
              <p className="font-medium text-slate-700">{formatDateTime(dimension.updatedAt)}</p>
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
