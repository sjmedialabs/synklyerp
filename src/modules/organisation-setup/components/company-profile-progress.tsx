"use client";

import { PROFILE_SECTIONS, isSectionComplete, type ProfileSectionId } from "@/lib/organisation-setup/company-profile/completion";
import type { CompanyProfileDraftInput } from "@/validators/company-profile";

type Props = {
  form: CompanyProfileDraftInput;
  percentage: number;
  completedCount: number;
};

export function CompanyProfileProgress({ form, percentage, completedCount }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">Profile completion</span>
        <span className="text-slate-500">
          {completedCount}/{PROFILE_SECTIONS.length} sections · {percentage}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {PROFILE_SECTIONS.map((section) => {
          const done = isSectionComplete(section.id as ProfileSectionId, form);
          return (
            <span
              key={section.id}
              className={`rounded-full px-2.5 py-0.5 text-xs ${
                done
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {section.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
