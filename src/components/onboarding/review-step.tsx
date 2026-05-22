"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Layers } from "lucide-react";
import { moduleLabel, submoduleLabel } from "@/lib/modules/activation";
import type { ErpModuleKey, ErpSubmoduleKey } from "@/constants/onboarding";

type ReviewStepProps = {
  typeName?: string;
  categoryName?: string;
  specializationName?: string;
  companyName?: string;
  employeeCount?: string | null;
  businessSize?: string | null;
  previewModules: string[];
  previewSubmodules: string[];
  workflowNames?: string[];
  onEditStep: (step: number) => void;
};

export function ReviewStep({
  typeName,
  categoryName,
  specializationName,
  companyName,
  employeeCount,
  businessSize,
  previewModules,
  previewSubmodules,
  workflowNames = [],
  onEditStep,
}: ReviewStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Review & confirm</h2>
        <p className="mt-1 text-sm text-slate-500">
          Please review your selections. Business configuration is locked after confirmation.
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Selected configuration</h3>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Business type</dt>
            <dd className="font-medium">{typeName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Category</dt>
            <dd className="font-medium">{categoryName ?? "—"}</dd>
          </div>
          {specializationName && (
            <div>
              <dt className="text-slate-500">Subcategory</dt>
              <dd className="font-medium">{specializationName}</dd>
            </div>
          )}
          <div>
            <dt className="text-slate-500">Company</dt>
            <dd className="font-medium">{companyName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Employees</dt>
            <dd className="font-medium">{employeeCount ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Business size</dt>
            <dd className="font-medium">{businessSize ?? "—"}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="mt-3 text-xs font-medium text-indigo-600 hover:underline"
          onClick={() => onEditStep(0)}
        >
          Edit selection
        </button>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Layers size={16} className="text-indigo-600" />
          Modules to be enabled
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {previewModules.map((key) => (
            <li
              key={key}
              className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
            >
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              {moduleLabel(key as ErpModuleKey)}
            </li>
          ))}
        </ul>
      </div>

      {workflowNames.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Suggested workflows</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {workflowNames.map((name) => (
              <li
                key={name}
                className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Capabilities to be configured</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {previewSubmodules.map((key) => (
            <li
              key={key}
              className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
            >
              <CheckCircle2 size={16} className="shrink-0 text-indigo-500" />
              {submoduleLabel(key as ErpSubmoduleKey)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
          After confirmation, business type and module activation cannot be changed without super admin assistance.
        </p>
      </div>
    </motion.div>
  );
}
