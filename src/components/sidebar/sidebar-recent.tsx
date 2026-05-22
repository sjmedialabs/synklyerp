"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

type SidebarRecentProps = {
  recent: { path: string; name: string; slug: string }[];
  onNavigate?: () => void;
};

export function SidebarRecent({ recent, onNavigate }: SidebarRecentProps) {
  if (!recent.length) return null;

  return (
    <div className="mb-3">
      <p className="mb-1 flex items-center gap-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <Clock size={10} /> Recent
      </p>
      <div className="flex flex-col gap-0.5">
        {recent.slice(0, 5).map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={onNavigate}
            className="truncate rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
