"use client";

import Link from "next/link";
import type { DashboardShortcutDef } from "@/config/dashboard-widgets";
import { DashboardIcon } from "@/components/dashboard/icon-map";

export function QuickActionsPanel({ shortcuts }: { shortcuts: DashboardShortcutDef[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <DashboardIcon name="Zap" className="h-[18px] w-[18px] text-indigo-600" />
        Quick actions
      </h3>
      {shortcuts.length === 0 ? (
        <p className="text-sm text-slate-500">No quick actions available for your role.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {shortcuts.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-indigo-900/30"
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
