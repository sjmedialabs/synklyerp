"use client";

import { cn } from "@/lib/utils";

export type SummaryCard = {
  label: string;
  value: string | number;
  sublabel?: string;
  iconClass?: string;
};

type Props = {
  cards: SummaryCard[];
};

export function MastersSummaryCards({ cards }: Props) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-xs font-medium text-slate-500">{card.label}</p>
          <p className={cn("mt-1 text-2xl font-bold text-slate-900 dark:text-white")}>{card.value}</p>
          {card.sublabel && <p className="mt-0.5 text-xs text-slate-500">{card.sublabel}</p>}
        </div>
      ))}
    </div>
  );
}
