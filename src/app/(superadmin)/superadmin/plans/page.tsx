"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ERP_MODULE_KEYS } from "@/constants/onboarding";

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  planType: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  trialDays: number;
  currency: string;
  features: string[];
  modules: string[];
  status: string;
  sortOrder: number;
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  planType: "starter",
  monthlyPriceCents: 0,
  yearlyPriceCents: 0,
  trialDays: 14,
  currency: "INR",
  featuresText: "",
  modules: [] as string[],
  status: "ACTIVE",
  sortOrder: 0,
};

export default function SuperAdminPlansPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["superadmin-plans"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/plans");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as Plan[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        id: editing?.id,
        name: form.name,
        slug: form.slug,
        description: form.description,
        planType: form.planType,
        monthlyPriceCents: Number(form.monthlyPriceCents),
        yearlyPriceCents: Number(form.yearlyPriceCents),
        trialDays: Number(form.trialDays),
        currency: form.currency,
        features: form.featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
        modules: form.modules,
        status: form.status,
        sortOrder: Number(form.sortOrder),
      };
      const res = await fetch(editing ? `/api/superadmin/plans/${editing.id}` : "/api/superadmin/plans", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin-plans"] });
      toast.success(editing ? "Plan updated" : "Plan created");
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? "",
      planType: plan.planType,
      monthlyPriceCents: plan.monthlyPriceCents,
      yearlyPriceCents: plan.yearlyPriceCents,
      trialDays: plan.trialDays,
      currency: plan.currency,
      featuresText: plan.features.join("\n"),
      modules: plan.modules,
      status: plan.status,
      sortOrder: plan.sortOrder,
    });
    setOpen(true);
  };

  const formatPrice = (cents: number) =>
    cents === 0 ? "Custom" : `₹${(cents / 100).toLocaleString("en-IN")}`;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-slate-400 text-sm mt-1">Manage pricing, modules, and feature access per plan.</p>
        </div>
        <Button
          className="bg-indigo-600"
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
            setOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" /> New Plan
        </Button>
      </div>

      {isLoading && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 border-b border-slate-800">
            <tr>
              {["Name", "Slug", "Type", "Monthly", "Modules", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-slate-400 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.slug}</td>
                <td className="px-4 py-3">{p.planType}</td>
                <td className="px-4 py-3">{formatPrice(p.monthlyPriceCents)}</td>
                <td className="px-4 py-3 text-slate-400">{p.modules.join(", ") || "—"}</td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => openEdit(p)}>
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Plan" : "Create Plan"} size="lg">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
          <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required /></div>
          <div className="sm:col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
          <div>
            <Label>Type</Label>
            <Select value={form.planType} onChange={(e) => setForm((f) => ({ ...f, planType: e.target.value }))}>
              {["free", "starter", "professional", "enterprise", "custom"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div><Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </Select>
          </div>
          <div><Label>Monthly (paise)</Label><Input type="number" value={form.monthlyPriceCents} onChange={(e) => setForm((f) => ({ ...f, monthlyPriceCents: Number(e.target.value) }))} /></div>
          <div><Label>Yearly (paise)</Label><Input type="number" value={form.yearlyPriceCents} onChange={(e) => setForm((f) => ({ ...f, yearlyPriceCents: Number(e.target.value) }))} /></div>
          <div><Label>Trial days</Label><Input type="number" value={form.trialDays} onChange={(e) => setForm((f) => ({ ...f, trialDays: Number(e.target.value) }))} /></div>
          <div><Label>Sort order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} /></div>
          <div className="sm:col-span-2">
            <Label>Features (one per line)</Label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              rows={4}
              value={form.featuresText}
              onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>ERP Modules</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ERP_MODULE_KEYS.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.modules.includes(m)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        modules: e.target.checked ? [...f.modules, m] : f.modules.filter((x) => x !== m),
                      }))
                    }
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} className="bg-indigo-600">
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
