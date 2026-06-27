"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api/client";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  legacy_key: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  business_type_id: string;
  business_types?: { name: string; slug: string } | null;
};

type BusinessTypeRow = {
  id: string;
  name: string;
};

export default function SuperAdminBusinessCategoriesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    businessTypeId: "",
    name: "",
    slug: "",
    icon: "circle",
    sortOrder: 0,
  });

  const { data: types = [] } = useQuery({
    queryKey: ["superadmin", "business-types"],
    queryFn: () => fetchApi<BusinessTypeRow[]>("/api/superadmin/business-types"),
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["superadmin", "business-categories"],
    queryFn: () => fetchApi<CategoryRow[]>("/api/superadmin/business-categories"),
  });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      fetchApi("/api/superadmin/business-categories", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Subcategory saved");
      qc.invalidateQueries({ queryKey: ["superadmin", "business-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/superadmin/business-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Subcategory deleted");
      qc.invalidateQueries({ queryKey: ["superadmin", "business-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.businessTypeId || !form.name || !form.slug) return;
    save.mutate(
      {
        businessTypeId: form.businessTypeId,
        name: form.name,
        slug: form.slug,
        icon: form.icon,
        sortOrder: form.sortOrder,
        isActive: true,
      },
      {
        onSuccess: () => {
          setForm({ businessTypeId: form.businessTypeId, name: "", slug: "", icon: "circle", sortOrder: 0 });
        },
      }
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Business Subcategories</h1>
        <p className="mt-1 text-slate-600">
          Industry subcategories previewed on onboarding cards (Manufacturing, Retail, IT Services, etc.)
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Plus className="h-4 w-4" /> Add subcategory
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={form.businessTypeId}
            onChange={(e) => setForm({ ...form, businessTypeId: e.target.value })}
          >
            <option value="">Business category</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="icon"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
        </div>
        <Button
          className="mt-4"
          onClick={handleCreate}
          disabled={!form.businessTypeId || !form.name || !form.slug || save.isPending}
        >
          Save subcategory
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {["Subcategory", "Slug", "Business Category", "Icon", "Order", "Active", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.slug}</td>
                  <td className="px-4 py-3">{c.business_types?.name ?? "—"}</td>
                  <td className="px-4 py-3">{c.icon}</td>
                  <td className="px-4 py-3">{c.sort_order}</td>
                  <td className="px-4 py-3">{c.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-slate-500 hover:text-red-600"
                      onClick={() => {
                        if (confirm(`Delete ${c.name}?`)) remove.mutate(c.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
