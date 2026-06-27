"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { fetchApi } from "@/lib/api/client";
import { resolveOnboardingIcon } from "@/lib/onboarding/icon-map";

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

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  legacyKey: "",
  icon: "package",
  sortOrder: 0,
};

export default function SuperAdminBusinessTypesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const {
    data: types = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["superadmin", "business-types"],
    queryFn: () => fetchApi<BusinessTypeRow[]>("/api/superadmin/business-types"),
  });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      fetchApi("/api/superadmin/business-types", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Business category saved");
      qc.invalidateQueries({ queryKey: ["superadmin", "business-types"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/superadmin/business-types/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Business category deleted");
      qc.invalidateQueries({ queryKey: ["superadmin", "business-types"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = (row: BusinessTypeRow) => {
    save.mutate({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      legacyKey: row.legacy_key,
      icon: row.icon,
      sortOrder: row.sort_order,
      isActive: !row.is_active,
    });
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    save.mutate(
      {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        legacyKey: form.legacyKey || null,
        icon: form.icon,
        sortOrder: form.sortOrder,
        isActive: true,
      },
      {
        onSuccess: () => {
          setForm(emptyForm);
          setModalOpen(false);
        },
      }
    );
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Business Categories</h1>
          <p className="mt-1 text-slate-600">
            Product Based, Service Based, Hybrid — created by Platform Admin. Assign menus and submenus per category.
          </p>
        </div>
        <Button className="shrink-0 bg-indigo-600" onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add business category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Failed to load business categories: {(error as Error).message}
        </div>
      ) : types.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <Layers className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">No business categories yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Run migration <code className="text-slate-700">011_business_provisioning_engine.sql</code> in Supabase to
            seed Product, Service, and Hybrid categories — or add one with the button above.
          </p>
          <Button className="mt-6 bg-indigo-600" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add business category
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Assign menus & submenus to category
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {["Category", "Slug", "Legacy key", "Order", "Status", "Description", ""].map((h) => (
                    <th key={h || "actions"} className="px-4 py-3 text-left font-medium text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {types.map((t) => {
                  const Icon = resolveOnboardingIcon(t.icon);
                  return (
                    <tr key={t.id} className="border-t border-slate-200">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="font-medium text-slate-900">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{t.slug}</td>
                      <td className="px-4 py-3 text-slate-600">{t.legacy_key ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{t.sort_order}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className={
                            t.is_active
                              ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                              : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
                          }
                          onClick={() => toggleActive(t)}
                        >
                          {t.is_active ? "Enabled" : "Disabled"}
                        </button>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-600">{t.description ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/superadmin/business-types/${t.slug}/features`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                            Assign Features
                          </Link>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-slate-300 text-slate-600 hover:text-red-600"
                            onClick={() => {
                              if (confirm(`Delete ${t.name}?`)) remove.mutate(t.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add business category"
        description="Create a new business category for onboarding and feature assignment."
        size="lg"
      >
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Product Based"
              required
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="product-based"
              required
            />
          </div>
          <div>
            <Label>Legacy key</Label>
            <Input
              value={form.legacyKey}
              onChange={(e) => setForm((f) => ({ ...f, legacyKey: e.target.value }))}
              placeholder="Product"
            />
          </div>
          <div>
            <Label>Icon</Label>
            <Input
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              placeholder="package"
            />
          </div>
          <div>
            <Label>Sort order</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Businesses primarily selling physical or digital products"
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600" disabled={!form.name || !form.slug || save.isPending}>
              {save.isPending ? "Saving..." : "Save category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
