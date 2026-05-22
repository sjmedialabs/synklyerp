"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  legacy_key: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  business_types?: { name: string; slug: string } | null;
};

export default function SuperAdminBusinessCategoriesPage() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["superadmin", "business-categories"],
    queryFn: () => fetchApi<CategoryRow[]>("/api/superadmin/business-categories"),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Business Categories</h1>
        <p className="mt-1 text-slate-400">
          Industry categories mapped to business types. Manage via API POST /api/superadmin/business-categories.
        </p>
      </div>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900">
              <tr>
                {["Category", "Slug", "Business Type", "Icon", "Order", "Active"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.slug}</td>
                  <td className="px-4 py-3">{c.business_types?.name ?? "—"}</td>
                  <td className="px-4 py-3">{c.icon}</td>
                  <td className="px-4 py-3">{c.sort_order}</td>
                  <td className="px-4 py-3">{c.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
