"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { resolveOnboardingIcon } from "@/lib/onboarding/icon-map";

type BusinessTypeRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
};

export default function FeatureAssignmentHubPage() {
  const { data: types = [], isLoading } = useQuery({
    queryKey: ["superadmin", "business-types"],
    queryFn: () => fetchApi<BusinessTypeRow[]>("/api/superadmin/business-types"),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Assign Features to Categories</h1>
        <p className="mt-1 max-w-3xl text-slate-600">
          Each business category (Product, Service, Hybrid) gets its own set of menus and submenus. Common features
          like Dashboard can be assigned to all categories. Disabled features in ERP Features master are hidden here.
        </p>
      </div>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {types.map((t) => {
            const Icon = resolveOnboardingIcon(t.icon);
            return (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-500">{t.slug}</p>
                  </div>
                </div>
                {t.description && <p className="mt-3 text-sm text-slate-600">{t.description}</p>}
                <Link
                  href={`/superadmin/business-types/${t.slug}/features`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium hover:bg-indigo-500"
                >
                  <Settings2 className="h-4 w-4" />
                  Assign Features
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
