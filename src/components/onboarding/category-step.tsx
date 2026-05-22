"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { SelectionCard } from "@/components/onboarding/selection-card";
import type { BusinessCategoryOption } from "@/hooks/onboarding/use-onboarding-flow";

type CategoryStepProps = {
  categories: BusinessCategoryOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  typeName?: string;
};

export function CategoryStep({ categories, selectedId, onSelect, loading, typeName }: CategoryStepProps) {
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Choose your category</h2>
        <p className="mt-1 text-sm text-slate-500">
          {typeName ? `Categories for ${typeName}.` : "Select the category that best describes your business."}
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No categories configured yet. Contact your platform administrator.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <SelectionCard
              key={category.id}
              compact
              title={category.name}
              description={category.description}
              icon={category.icon}
              selected={selectedId === category.id}
              onSelect={() => onSelect(category.id)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
