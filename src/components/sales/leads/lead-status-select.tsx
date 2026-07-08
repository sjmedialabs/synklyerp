"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_VIEW_STATUSES, viewStatusOption } from "@/lib/sales/lead-stages";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  compact?: boolean;
};

export function LeadStatusSelect({ value, onChange, className, compact }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = viewStatusOption(value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {!compact && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lead Status</p>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white text-left font-medium text-slate-800 shadow-sm hover:border-slate-300",
          compact ? "h-8 min-w-[140px] px-2.5 text-xs" : "w-full min-w-[200px] px-3 py-2.5 text-sm"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Lead status"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", selected.dot)} />
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown size={compact ? 14 : 16} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          className="absolute right-0 z-30 mt-1 w-full min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {LEAD_VIEW_STATUSES.map((opt) => {
            const active = value === opt.value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-slate-50 sm:text-sm sm:py-2 sm:px-3",
                    active && "bg-indigo-50 text-indigo-700"
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", opt.dot)} />
                  <span className="flex-1 font-medium">{opt.label}</span>
                  {active && <Check size={14} className="text-indigo-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
