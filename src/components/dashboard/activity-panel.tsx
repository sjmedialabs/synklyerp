"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DashboardIcon } from "@/components/dashboard/icon-map";

type ActivityRow = {
  module: string;
  action: string;
  userName?: string;
  createdAt: string;
};

export function ActivityPanel() {
  const { data: activity = [], isLoading } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: async () => {
      const res = await fetch("/api/activity-logs?limit=8");
      const json = await res.json();
      if (!json.success) return [] as ActivityRow[];
      return json.data as ActivityRow[];
    },
    staleTime: 30_000,
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <DashboardIcon name="Activity" className="h-[18px] w-[18px] text-indigo-600" />
        Recent activity
      </h3>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : activity.length === 0 ? (
        <p className="text-sm text-slate-500">
          No activity yet. Actions across your enabled modules will appear here.
        </p>
      ) : (
        <ul className="space-y-3">
          {activity.map((a, i) => (
            <li
              key={i}
              className="flex items-start justify-between border-b border-slate-100 pb-2 text-sm last:border-0 dark:border-slate-800"
            >
              <span>
                <span className="font-medium capitalize text-slate-900 dark:text-white">{a.module}</span>
                <span className="text-slate-500"> · {a.action.replace(/_/g, " ")}</span>
                {a.userName && <span className="text-slate-400"> by {a.userName}</span>}
              </span>
              <span className="shrink-0 text-xs text-slate-400">
                {new Date(a.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
