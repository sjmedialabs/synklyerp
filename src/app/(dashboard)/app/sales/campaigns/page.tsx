"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  useCampaignAttributions,
  useCampaignMutations,
  useCampaigns,
} from "@/hooks/sales/crm";

export default function CampaignsPage() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: attributions = [], isLoading: attrLoading } = useCampaignAttributions(selectedId);
  const mutations = useCampaignMutations();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Campaigns"
        description="Track campaign performance, spend, and lead attribution from ads and UTM sources."
        actions={
          <Button className="bg-indigo-600 text-white" onClick={() => setOpen(true)}>
            <Plus size={16} className="mr-2" /> New Campaign
          </Button>
        }
      />

      {isLoading && (
        <div className="flex gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading campaigns...
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedId(c.id === selectedId ? undefined : c.id)}
            className={`rounded-xl border p-4 text-left transition ${
              selectedId === c.id
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{c.name}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{c.status}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{c.code}{c.channel ? ` · ${c.channel}` : ""}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-slate-500">Leads</dt><dd className="font-medium">{c.leadCount}</dd></div>
              <div><dt className="text-slate-500">Cost</dt><dd className="font-medium">${c.totalCost.toFixed(2)}</dd></div>
              <div><dt className="text-slate-500">Budget</dt><dd className="font-medium">{c.budget != null ? `$${c.budget}` : "—"}</dd></div>
              <div><dt className="text-slate-500">Spend</dt><dd className="font-medium">${c.spend.toFixed(2)}</dd></div>
            </dl>
          </button>
        ))}
      </div>

      {campaigns.length === 0 && !isLoading && (
        <p className="text-sm text-slate-500">No campaigns defined. Create one or capture leads with UTM campaign data.</p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            Lead attributions{selectedId ? ` (${campaigns.find((c) => c.id === selectedId)?.name})` : ""}
          </h2>
        </div>
        {attrLoading && <div className="p-4 text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin" /> Loading...</div>}
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
            <tr>
              {["Lead", "Campaign", "Channel", "Cost", "Captured"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributions.length === 0 && !attrLoading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No attributions yet.</td></tr>
            ) : (
              attributions.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link href={`/app/sales/leads/${a.leadId}`} className="font-medium text-indigo-600 hover:underline">
                      {a.lead?.name ?? a.leadId.slice(0, 8)}
                    </Link>
                    {a.lead?.email && <p className="text-xs text-slate-500">{a.lead.email}</p>}
                  </td>
                  <td className="px-4 py-3">{a.campaign ?? "—"}</td>
                  <td className="px-4 py-3">{a.channel ?? "—"}</td>
                  <td className="px-4 py-3">{a.cost != null ? `$${a.cost}` : "—"}</td>
                  <td className="px-4 py-3">{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="New Campaign">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              await mutations.create.mutateAsync({
                name: fd.get("name"),
                channel: fd.get("channel") || undefined,
                utmCampaign: fd.get("utmCampaign") || undefined,
                budget: fd.get("budget") ? Number(fd.get("budget")) : undefined,
                status: "ACTIVE",
              });
              toast.success("Campaign created");
              setOpen(false);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        >
          <div><Label>Name *</Label><Input name="name" required placeholder="Q2 Google Ads" /></div>
          <div>
            <Label>Channel</Label>
            <Select name="channel" defaultValue="">
              <option value="">Any</option>
              <option value="google">Google</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
            </Select>
          </div>
          <div><Label>UTM campaign</Label><Input name="utmCampaign" placeholder="spring_promo" /></div>
          <div><Label>Budget ($)</Label><Input name="budget" type="number" min={0} step="0.01" /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 text-white">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
