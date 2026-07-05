"use client";

import { cn } from "@/lib/utils";
import { LEAD_STAGE_TABS, type DashboardCounts, type LeadStageTab } from "@/lib/sales/lead-stages";

type Props = {
  active: LeadStageTab;
  counts: DashboardCounts;
  onChange: (tab: LeadStageTab) => void;
};

export function LeadStageTabs({ active, counts, onChange }: Props) {
  return (
    <div
      className="sticky top-0 z-10 -mx-1 overflow-x-auto border-b border-slate-200/80 bg-slate-50/95 backdrop-blur"
      role="tablist"
      aria-label="Lead stage filters"
    >
      <div className="flex min-w-max gap-2 px-1 pb-3 pt-1">
        {LEAD_STAGE_TABS.map((tab) => {
          const isActive = active === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "min-w-[1.5rem] rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
