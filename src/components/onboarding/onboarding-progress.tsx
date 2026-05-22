"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Business type", "Category", "Subcategory", "Organization", "Review"] as const;

type OnboardingProgressProps = {
  currentStep: number;
};

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="flex flex-wrap items-center justify-center gap-2">
        {STEP_LABELS.map((label, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <li key={label} className="flex items-center gap-2">
              <motion.span
                initial={false}
                animate={{
                  scale: active ? 1.05 : 1,
                  opacity: index > currentStep ? 0.5 : 1,
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  active && "bg-indigo-600 text-white shadow-md shadow-indigo-600/25",
                  done && !active && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
                  !done && !active && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                <span className="font-semibold">{index + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </motion.span>
              {index < STEP_LABELS.length - 1 && (
                <span className="hidden h-px w-4 bg-slate-200 dark:bg-slate-700 sm:block" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { STEP_LABELS };
