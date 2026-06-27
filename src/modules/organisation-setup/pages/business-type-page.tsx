"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { useOnboardingState } from "@/hooks/tenant/use-onboarding";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type FeatureLink = {
  code: string;
  name: string;
  path: string | null;
};

type BusinessProfileApi = {
  moduleLinks: FeatureLink[];
  activeBusinessCategory: {
    name: string;
  } | null;
  businessType: { name: string; legacyKey: string | null } | null;
};

function ModuleLinkItem({ item }: { item: FeatureLink }) {
  const inner = (
    <>
      <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
      <span className="min-w-0 flex-1 truncate">{item.name}</span>
      {item.path && <ChevronRight size={12} className="shrink-0 text-slate-400" />}
    </>
  );

  if (!item.path) {
    return (
      <li className="flex items-center gap-2 rounded-md border border-slate-100 px-2.5 py-1.5 text-sm dark:border-slate-800">
        {inner}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.path}
        className="flex items-center gap-2 rounded-md border border-slate-100 px-2.5 py-1.5 text-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-800 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
      >
        {inner}
      </Link>
    </li>
  );
}

export default function BusinessTypeSetupPage() {
  const { data: state, isLoading } = useOnboardingState();

  const { data: profileView, isLoading: profileLoading } = useQuery({
    queryKey: ["tenant", "business-profile", "setup"],
    queryFn: () => fetchApi<BusinessProfileApi>("/api/tenant/business-profile"),
    staleTime: 60_000,
  });

  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  const businessTypeLabel =
    profileView?.activeBusinessCategory?.name ??
    profileView?.businessType?.name ??
    state?.businessType ??
    "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Business Type</h1>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
              {businessTypeLabel}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            ERP modules enabled for your organisation&apos;s business type.
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {state?.employeeCount && (
            <div>
              <dt className="text-xs text-slate-500">Employees</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{state.employeeCount}</dd>
            </div>
          )}
          {state?.businessSize && (
            <div>
              <dt className="text-xs text-slate-500">Size</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{state.businessSize}</dd>
            </div>
          )}
        </dl>
      </div>

      {!state?.completed && (
        <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
          Onboarding incomplete — contact your administrator if modules are missing.
        </p>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Active ERP modules</h2>
          <span className="text-xs text-slate-500">{(profileView?.moduleLinks?.length ?? 0) || 0} available</span>
        </div>
        {(profileView?.moduleLinks?.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-500">No modules assigned to this business type yet.</p>
        ) : (
          <ul
            className={cn(
              "grid gap-1.5",
              profileView!.moduleLinks.length > 4 ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "sm:grid-cols-2"
            )}
          >
            {profileView?.moduleLinks.map((item) => (
              <ModuleLinkItem key={item.code} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
