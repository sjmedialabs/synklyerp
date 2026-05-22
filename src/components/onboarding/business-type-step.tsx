"use client";

import { motion } from "framer-motion";
import { SelectionCard } from "@/components/onboarding/selection-card";
import type { BusinessTypeOption } from "@/hooks/onboarding/use-onboarding-flow";

type BusinessTypeStepProps = {
  types: BusinessTypeOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  categoriesByType?: Record<string, { label: string; icon?: string | null }[]>;
};

export function BusinessTypeStep({ types, selectedId, onSelect, categoriesByType }: BusinessTypeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">What kind of business?</h2>
        <p className="mt-1 text-sm text-slate-500">Select your business nature to customise modules, dashboard, and workflows.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {types.map((type) => (
          <SelectionCard
            key={type.id}
            title={type.name.replace(/-Based Business| Business/gi, "").trim() || type.name}
            description={type.description}
            icon={type.icon}
            accentColor={type.color}
            selected={selectedId === type.id}
            onSelect={() => onSelect(type.id)}
            items={categoriesByType?.[type.id]}
          />
        ))}
      </div>
    </motion.div>
  );
}
