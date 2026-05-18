"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { moduleLabel } from "@/lib/modules/activation";
import type { ErpModuleKey } from "@/constants/onboarding";

export function ModuleUnavailableContent() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("module");
  const moduleKey = raw as ErpModuleKey | null;
  const label = moduleKey ? moduleLabel(moduleKey) : "This module";

  return (
    <div>
      <PageHeader
        title="Module not available"
        description={`${label} is not enabled for your workspace.`}
        badge={
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Access restricted
          </span>
        }
      />

      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
          <Lock className="h-6 w-6" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Your tenant administrator can enable modules during onboarding or from business setup. If you
          need access, contact an admin to update your business profile.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app">
            <Button>Back to dashboard</Button>
          </Link>
          <Link href="/app/setup/business-type">
            <Button variant="outline">Business setup</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
