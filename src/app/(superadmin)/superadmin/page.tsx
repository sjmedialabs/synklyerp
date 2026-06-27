"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { fetchApi } from "@/lib/api/client";

type TenantRow = {
  id: string;
  name: string;
  businessType: string;
  industrySubtype?: string | null;
  businessTypeSlug?: string | null;
  businessSubcategorySlug?: string | null;
  plan: string;
  status: string;
  subscriptionStatus?: string | null;
  expiresAt?: string | null;
  isExpired?: boolean;
  contactEmail?: string | null;
  createdAt: string;
};

type BusinessTypeOption = {
  id: string;
  name: string;
  slug: string;
  subcategories: { id: string; name: string; slug: string }[];
};

const emptyForm = {
  name: "",
  status: "ACTIVE",
  businessTypeSlug: "",
  businessSubcategorySlug: "",
  reason: "",
};

export default function SuperAdminPage() {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TenantRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: tenants = [], isLoading, error } = useQuery({
    queryKey: ["superadmin-tenants"],
    queryFn: () => fetchApi<TenantRow[]>("/api/superadmin/tenants"),
  });

  const { data: businessTypes = [] } = useQuery({
    queryKey: ["business-types"],
    queryFn: () => fetchApi<BusinessTypeOption[]>("/api/business-types"),
    staleTime: 300_000,
  });

  const selectedType = useMemo(
    () => businessTypes.find((t) => t.slug === form.businessTypeSlug),
    [businessTypes, form.businessTypeSlug]
  );

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      fetchApi(`/api/superadmin/tenants/${editing!.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Tenant updated");
      qc.invalidateQueries({ queryKey: ["superadmin-tenants"] });
      setEditOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetchApi(`/api/superadmin/tenants/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success("Tenant status updated");
      qc.invalidateQueries({ queryKey: ["superadmin-tenants"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (tenant: TenantRow) => {
    setEditing(tenant);
    const typeSlug =
      tenant.businessTypeSlug ??
      businessTypes.find(
        (t) =>
          t.slug === tenant.businessType.toLowerCase() ||
          t.name.toLowerCase().includes(tenant.businessType.toLowerCase())
      )?.slug ??
      "";
    const type = businessTypes.find((t) => t.slug === typeSlug);
    setForm({
      name: tenant.name,
      status: tenant.status,
      businessTypeSlug: typeSlug,
      businessSubcategorySlug:
        tenant.businessSubcategorySlug ?? type?.subcategories[0]?.slug ?? "",
      reason: "",
    });
    setEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const payload: Record<string, unknown> = {
      name: form.name,
      status: form.status,
    };

    const typeChanged =
      form.businessTypeSlug &&
      form.businessTypeSlug !== (editing.businessTypeSlug ?? editing.businessType.toLowerCase());

    if (typeChanged || form.businessTypeSlug) {
      payload.businessTypeSlug = form.businessTypeSlug;
      if (form.businessSubcategorySlug) {
        payload.businessSubcategorySlug = form.businessSubcategorySlug;
      }
      payload.reason = form.reason.trim() || "Super admin tenant update";
    }

    save.mutate(payload);
  };

  const active = tenants.filter((t) => t.status === "ACTIVE").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tenants</h1>
        <p className="mt-1 text-slate-600">Edit tenant details, business type, and enable or disable access.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Clients", value: tenants.length },
          { label: "Active Clients", value: active },
          { label: "Plans", value: new Set(tenants.map((t) => t.plan)).size },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="mb-4 flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading clients...
        </div>
      )}
      {error && <p className="mb-4 text-red-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Company", "Type", "Plan", "Status", "Expires", "Joined", ""].map((h) => (
                <th key={h || "actions"} className="px-4 py-3 text-left font-medium text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => {
              const isActive = tenant.status === "ACTIVE";
              return (
                <tr key={tenant.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3">{tenant.businessType}</td>
                  <td className="px-4 py-3">{tenant.plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        isActive
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                      }
                    >
                      {tenant.status}
                    </span>
                    {tenant.subscriptionStatus && (
                      <p className="mt-1 text-xs capitalize text-slate-500">{tenant.subscriptionStatus}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tenant.expiresAt ? (
                      <span className={tenant.isExpired ? "text-red-600" : "text-slate-700"}>
                        {new Date(tenant.expiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit tenant"
                        onClick={() => openEdit(tenant)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={`h-8 w-8 ${isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}`}
                        title={isActive ? "Disable tenant" : "Enable tenant"}
                        disabled={toggleStatus.isPending}
                        onClick={() =>
                          toggleStatus.mutate({
                            id: tenant.id,
                            status: isActive ? "INACTIVE" : "ACTIVE",
                          })
                        }
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit tenant"
        description="Update company details, business type, and status. No tenant deletion — disable instead."
        size="lg"
      >
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSave}>
          <div className="sm:col-span-2">
            <Label>Company name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
          <div>
            <Label>Plan</Label>
            <Input value={editing?.plan ?? ""} disabled className="bg-slate-50" />
          </div>
          <div>
            <Label>Business type</Label>
            <Select
              value={form.businessTypeSlug}
              onChange={(e) => {
                const slug = e.target.value;
                const type = businessTypes.find((t) => t.slug === slug);
                setForm((f) => ({
                  ...f,
                  businessTypeSlug: slug,
                  businessSubcategorySlug: type?.subcategories[0]?.slug ?? "",
                }));
              }}
            >
              <option value="">Select category</option>
              {businessTypes.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Subcategory</Label>
            <Select
              value={form.businessSubcategorySlug}
              disabled={!selectedType?.subcategories.length}
              onChange={(e) => setForm((f) => ({ ...f, businessSubcategorySlug: e.target.value }))}
            >
              {(selectedType?.subcategories ?? []).map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Reason (for business type change)</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Optional note for audit log"
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600" disabled={save.isPending || !form.name}>
              {save.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
