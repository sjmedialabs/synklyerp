"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { fetchApi } from "@/lib/api/client";

type Tab = "routing" | "scoring" | "automation";

async function getJson<T>(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data as T;
}

export default function SalesAutomationPage() {
  const [tab, setTab] = useState<Tab>("routing");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: routing = [], isLoading: rLoading } = useQuery({
    queryKey: ["crm", "routing"],
    queryFn: () => getJson<{ id: string; name: string; ruleType: string; priority: number; isActive: boolean }[]>("/api/sales/capture/routing"),
  });

  const { data: scoring = [], isLoading: sLoading } = useQuery({
    queryKey: ["crm", "scoring"],
    queryFn: () => getJson<{ id: string; name: string; eventCode: string; points: number; isActive: boolean }[]>("/api/sales/capture/scoring?seed=1"),
  });

  const { data: automation = [], isLoading: aLoading } = useQuery({
    queryKey: ["crm", "automation"],
    queryFn: () => getJson<{ id: string; name: string; triggerEvent: string; isActive: boolean }[]>("/api/sales/capture/automation"),
  });

  const createRouting = useMutation({
    mutationFn: (body: unknown) => fetchApi("/api/sales/capture/routing", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", "routing"] }); setOpen(false); toast.success("Routing rule created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createScoring = useMutation({
    mutationFn: (body: unknown) => fetchApi("/api/sales/capture/scoring", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", "scoring"] }); setOpen(false); toast.success("Score rule created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createAutomation = useMutation({
    mutationFn: (body: unknown) => fetchApi("/api/sales/capture/automation", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", "automation"] }); setOpen(false); toast.success("Automation created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "routing", label: "Lead Routing" },
    { id: "scoring", label: "Lead Scoring" },
    { id: "automation", label: "Workflows" },
  ];

  const loading = rLoading || sLoading || aLoading;

  return (
    <div className="space-y-4">
      <PageHeader
        title="CRM Automation"
        description="Routing, scoring, and workflow automation for incoming leads."
        actions={
          <Button className="bg-indigo-600 text-white" onClick={() => setOpen(true)}>
            <Plus size={16} className="mr-2" /> Add rule
          </Button>
        }
      />

      <div className="flex gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t.id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}

      {tab === "routing" && (
        <table className="w-full text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <thead className="border-b bg-slate-50"><tr>{["Name", "Type", "Priority", "Active"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {routing.map((r) => (
              <tr key={r.id} className="border-t"><td className="px-4 py-3 font-medium">{r.name}</td><td className="px-4 py-3">{r.ruleType}</td><td className="px-4 py-3">{r.priority}</td><td className="px-4 py-3">{r.isActive ? "Yes" : "No"}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "scoring" && (
        <table className="w-full text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <thead className="border-b bg-slate-50"><tr>{["Name", "Event", "Points", "Active"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {scoring.map((r) => (
              <tr key={r.id} className="border-t"><td className="px-4 py-3 font-medium">{r.name}</td><td className="px-4 py-3">{r.eventCode}</td><td className="px-4 py-3">+{r.points}</td><td className="px-4 py-3">{r.isActive ? "Yes" : "No"}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "automation" && (
        <table className="w-full text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <thead className="border-b bg-slate-50"><tr>{["Name", "Trigger", "Active"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {automation.map((r) => (
              <tr key={r.id} className="border-t"><td className="px-4 py-3 font-medium">{r.name}</td><td className="px-4 py-3">{r.triggerEvent}</td><td className="px-4 py-3">{r.isActive ? "Yes" : "No"}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`New ${tab} rule`}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            if (tab === "routing") {
              createRouting.mutate({ name: fd.get("name"), ruleType: fd.get("ruleType"), priority: Number(fd.get("priority") ?? 0) });
            } else if (tab === "scoring") {
              createScoring.mutate({ name: fd.get("name"), eventCode: fd.get("eventCode"), points: Number(fd.get("points")) });
            } else {
              createAutomation.mutate({
                name: fd.get("name"),
                triggerEvent: fd.get("triggerEvent"),
                actions: [{ type: "add_note", note: "Welcome — automation triggered" }],
              });
            }
          }}
        >
          <div><Label>Name</Label><Input name="name" required /></div>
          {tab === "routing" && (
            <>
              <div><Label>Rule type</Label>
                <Select name="ruleType" defaultValue="round_robin">
                  <option value="round_robin">Round Robin</option>
                  <option value="least_loaded">Least Loaded</option>
                  <option value="source">By Source</option>
                </Select>
              </div>
              <div><Label>Priority</Label><Input name="priority" type="number" defaultValue={0} /></div>
            </>
          )}
          {tab === "scoring" && (
            <>
              <div><Label>Event code</Label><Input name="eventCode" placeholder="form_submitted" required /></div>
              <div><Label>Points</Label><Input name="points" type="number" defaultValue={10} required /></div>
            </>
          )}
          {tab === "automation" && (
            <div><Label>Trigger event</Label><Input name="triggerEvent" defaultValue="lead.created" required /></div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 text-white">Create</Button>
          </div>
        </form>
      </Modal>

      <p className="text-sm text-slate-500">
        <Link href="/app/sales/capture" className="text-indigo-600 hover:underline">Lead Capture Hub</Link>
        {" · "}
        <Link href="/app/sales/duplicates" className="text-indigo-600 hover:underline">Duplicate queue</Link>
      </p>
    </div>
  );
}
