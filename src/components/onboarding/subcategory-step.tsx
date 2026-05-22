"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { SelectionCard } from "@/components/onboarding/selection-card";
import type { BusinessSpecializationOption } from "@/hooks/onboarding/use-onboarding-flow";

type SubcategoryStepProps = {
  specializations: BusinessSpecializationOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  loading?: boolean;
  categoryName?: string;
  optional?: boolean;
};

export function SubcategoryStep({
  specializations,
  selectedId,
  onSelect,
  loading,
  categoryName,
  optional,
}: SubcategoryStepProps) {
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Refine your focus</h2>
        <p className="mt-1 text-sm text-slate-500">
          {categoryName
            ? `Specializations for ${categoryName}.${optional ? " You can skip this step if none apply." : ""}`
            : "Select a subcategory for tailored modules and dashboard presets."}
        </p>
      </div>

      {specializations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500">No subcategories configured for this category.</p>
          {optional && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
            >
              Continue without subcategory →
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {specializations.map((spec) => (
            <SelectionCard
              key={spec.id}
              compact
              title={spec.name}
              description={spec.description}
              icon={spec.icon}
              selected={selectedId === spec.id}
              onSelect={() => onSelect(spec.id)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
