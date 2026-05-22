"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api/client";

type BusinessTypeRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  legacy_key: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function SuperAdminBusinessTypesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    legacyKey: "",
    icon: "package",
    sortOrder: 0,
  });

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["superadmin", "business-types"],
    queryFn: () => fetchApi<BusinessTypeRow[]>("/api/superadmin/business-types"),
  });

  const save = useMutation({
    mutationFn: () =>
      fetchApi("/api/superadmin/business-types", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          legacyKey: form.legacyKey || null,
          icon: form.icon,
          sortOrder: form.sortOrder,
          isActive: true,
        }),
      }),
    onSuccess: () => {
      toast.success("Business type saved");
      qc.invalidateQueries({ queryKey: ["superadmin", "business-types"] });
      setForm({ name: "", slug: "", description: "", legacyKey: "", icon: "package", sortOrder: 0 });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Business Types</h1>
        <p className="mt-1 text-slate-400">Configure top-level business nature types for onboarding</p>
      </div>

      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Plus className="h-4 w-4" /> Add business type
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(["name", "slug", "legacyKey", "icon", "description"] as const).map((field) => (
            <input
              key={field}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder={field}
              value={form[field === "legacyKey" ? "legacyKey" : field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          ))}
        </div>
        <Button className="mt-4" onClick={() => save.mutate()} disabled={!form.name || !form.slug || save.isPending}>
          Save type
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900">
              <tr>
                {["Name", "Slug", "Legacy", "Icon", "Order", "Active"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">{t.slug}</td>
                  <td className="px-4 py-3">{t.legacy_key}</td>
                  <td className="px-4 py-3">{t.icon}</td>
                  <td className="px-4 py-3">{t.sort_order}</td>
                  <td className="px-4 py-3">{t.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
