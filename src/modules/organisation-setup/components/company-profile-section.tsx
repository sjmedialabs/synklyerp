"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  description?: string;
  complete?: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function CompanyProfileSection({
  id,
  title,
  description,
  complete,
  open,
  onToggle,
  children,
}: Props) {
  return (
    <section
      id={id}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900/70"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            {complete && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Complete</span>
            )}
          </div>
          {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
        </div>
      </button>
      {open ? <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">{children}</div> : null}
    </section>
  );
}
