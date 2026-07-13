"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useFinanceMasterStats } from "@/hooks/finance/masters";
import {
  FINANCE_MASTER_MORE_TABS,
  FINANCE_MASTER_PRIMARY_TABS,
} from "@/lib/finance/masters-tabs";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
};

export function FinanceMastersShell({ children }: Props) {
  const pathname = usePathname();
  const { data: stats } = useFinanceMasterStats();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current?.contains(e.target as Node)) return;
      setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [moreOpen]);

  const moreActive = FINANCE_MASTER_MORE_TABS.some((tab) => pathname.startsWith(tab.path));

  return (
    <div>
      <PageHeader
        title="Masters"
        description="Manage finance master data including chart of accounts, dimensions, and configuration."
        actions={
          <Button type="button" variant="outline" className="gap-2">
            <Settings size={16} /> Master Settings
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FINANCE_MASTER_PRIMARY_TABS.map((tab) => {
          const active = pathname.startsWith(tab.path);
          const count = stats?.[tab.statKey] ?? 0;
          return (
            <Link
              key={tab.slug}
              href={tab.path}
              className={cn(
                "min-w-[140px] rounded-xl border px-4 py-3 transition",
                active
                  ? "border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/30"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              )}
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{tab.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{count.toLocaleString()}</p>
            </Link>
          );
        })}

        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex min-w-[100px] items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition",
              moreActive || moreOpen
                ? "border-indigo-500 bg-indigo-50 text-slate-900 dark:border-indigo-400 dark:bg-indigo-950/30 dark:text-white"
                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            )}
          >
            More
            <ChevronDown size={16} className={cn("transition", moreOpen && "rotate-180")} />
          </button>
          {moreOpen && (
            <div className="absolute left-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {FINANCE_MASTER_MORE_TABS.map((tab) => (
                <Link
                  key={tab.slug}
                  href={tab.path}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800",
                    pathname.startsWith(tab.path) && "bg-indigo-50 font-medium text-indigo-700"
                  )}
                >
                  {tab.label}
                  <span className="text-xs text-slate-400">{stats?.[tab.statKey] ?? 0}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
