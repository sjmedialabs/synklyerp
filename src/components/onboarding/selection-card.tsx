"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveOnboardingIcon } from "@/lib/onboarding/icon-map";

type SelectionCardProps = {
  title: string;
  description?: string | null;
  icon?: string | null;
  selected?: boolean;
  onSelect: () => void;
  compact?: boolean;
  items?: { label: string; icon?: string | null }[];
  accentColor?: string | null;
  disabled?: boolean;
};

export function SelectionCard({
  title,
  description,
  icon,
  selected,
  onSelect,
  compact,
  items,
  accentColor,
  disabled,
}: SelectionCardProps) {
  const Icon = resolveOnboardingIcon(icon);

  return (
    <motion.button
      type="button"
      layout
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "group relative w-full rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
        compact ? "p-4" : "p-5 sm:p-6",
        selected
          ? "border-indigo-500 bg-indigo-50/80 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/30"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700",
        disabled && "cursor-not-allowed opacity-60"
      )}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            selected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 dark:border-slate-600"
          )}
        >
          {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: accentColor ? `${accentColor}20` : undefined,
                color: accentColor ?? undefined,
              }}
            >
              <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" style={{ color: accentColor ?? undefined }} />
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          </div>

          {description && (
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
          )}

          {items && items.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Included features
              </p>
              {items.slice(0, compact ? 4 : 8).map((item) => {
                const ItemIcon = resolveOnboardingIcon(item.icon);
                return (
                  <li key={item.label} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <ItemIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    {item.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </motion.button>
  );
}
