"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type OnboardingSuccessProps = {
  moduleCount: number;
  submoduleCount: number;
};

export function OnboardingSuccess({ moduleCount, submoduleCount }: OnboardingSuccessProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/40 p-8 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <CheckCircle2 className="h-12 w-12 text-emerald-600" />
      <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Your ERP is ready</h2>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        We activated {moduleCount} modules and {submoduleCount} industry capabilities for your workspace.
      </p>
      <Link
        href="/app"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Go to personalized dashboard
      </Link>
    </div>
  );
}
