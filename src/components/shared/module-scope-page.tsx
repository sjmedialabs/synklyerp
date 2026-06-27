"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { fetchApi } from "@/lib/api/client";
import type { ModulePageDefinition } from "@/config/module-page-registry";

type ModuleScopeResponse = {
  definition: ModulePageDefinition;
  items: {
    id: string;
    itemKey: string;
    title: string;
    description: string | null;
    status: string;
    sortOrder: number;
  }[];
};

type Props = {
  pagePath: string;
};

export function ModuleScopePage({ pagePath }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tenant", "module-scope", pagePath],
    queryFn: () => fetchApi<ModuleScopeResponse>(`/api/tenant/module-scope?path=${encodeURIComponent(pagePath)}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading module scope...
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-red-600">{(error as Error)?.message ?? "Failed to load module scope"}</p>;
  }

  const { definition, items } = data;

  return (
    <div className="space-y-4">
      <PageHeader
        title={definition.title}
        description={definition.description}
        badge={
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {definition.menuStatus === "built" ? "In scope" : "Planned"}
          </span>
        }
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">Module scope</h2>
        <p className="mt-1 text-sm text-slate-500">
          Scope items are stored per tenant and drive the rollout checklist for this workspace.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
            >
              <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
              {item.description && <p className="mt-1 text-slate-500">{item.description}</p>}
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{item.status.replace(/_/g, " ")}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
