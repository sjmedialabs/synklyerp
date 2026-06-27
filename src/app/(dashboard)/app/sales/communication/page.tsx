"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, MessageSquare, Plus, Workflow } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  useCommunicationLogs,
  useCommunicationSequences,
  useMessageTemplates,
  useSequenceMutations,
  useTemplateMutations,
} from "@/hooks/sales/crm";

type Tab = "templates" | "sequences" | "logs";

export default function CommunicationHubPage() {
  const [tab, setTab] = useState<Tab>("templates");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [sequenceOpen, setSequenceOpen] = useState(false);

  const { data: templates = [], isLoading: tLoading } = useMessageTemplates(true);
  const { data: sequences = [], isLoading: sLoading } = useCommunicationSequences();
  const { data: logs = [], isLoading: lLoading } = useCommunicationLogs();
  const templateMutations = useTemplateMutations();
  const sequenceMutations = useSequenceMutations();

  const tabs: { id: Tab; label: string; icon: typeof Mail }[] = [
    { id: "templates", label: "Templates", icon: Mail },
    { id: "sequences", label: "Sequences", icon: Workflow },
    { id: "logs", label: "Delivery Logs", icon: MessageSquare },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Communication Hub"
        description="Email, SMS, and WhatsApp templates with automated drip sequences for leads."
        actions={
          tab === "templates" ? (
            <Button className="bg-indigo-600 text-white" onClick={() => setTemplateOpen(true)}>
              <Plus size={16} className="mr-2" /> New Template
            </Button>
          ) : tab === "sequences" ? (
            <Button className="bg-indigo-600 text-white" onClick={() => setSequenceOpen(true)}>
              <Plus size={16} className="mr-2" /> New Sequence
            </Button>
          ) : null
        }
      />

      <div className="flex gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "templates" && (
        <>
          {tLoading && <LoaderRow />}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  {["Name", "Channel", "Subject", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 && !tLoading ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">No templates yet.</td></tr>
                ) : (
                  templates.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3 capitalize">{t.channel}</td>
                      <td className="px-4 py-3">{t.subject ?? "—"}</td>
                      <td className="px-4 py-3">{t.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">Use variables like <code>{`{{name}}`}</code>, <code>{`{{email}}`}</code>, <code>{`{{company}}`}</code> in templates.</p>
        </>
      )}

      {tab === "sequences" && (
        <>
          {sLoading && <LoaderRow />}
          <div className="space-y-3">
            {sequences.length === 0 && !sLoading ? (
              <p className="text-sm text-slate-500">No sequences. Create one to auto-send on lead.created.</p>
            ) : (
              sequences.map((seq) => (
                <section key={seq.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{seq.name}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{seq.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Trigger: {seq.triggerEvent}</p>
                  <ol className="mt-3 space-y-1 text-sm">
                    {seq.steps.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-slate-400">{i + 1}.</span>
                        <span>{step.templateName ?? "Template"}</span>
                        {step.delayMinutes > 0 && <span className="text-slate-500">(+{step.delayMinutes}m)</span>}
                      </li>
                    ))}
                  </ol>
                </section>
              ))
            )}
          </div>
        </>
      )}

      {tab === "logs" && (
        <>
          {lLoading && <LoaderRow />}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  {["Time", "Channel", "Recipient", "Subject", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && !lLoading ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No messages sent yet.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 capitalize">{log.channel}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.recipient || "—"}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{log.subject ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={log.status === "sent" ? "text-emerald-600" : log.status === "failed" ? "text-rose-600" : "text-slate-500"}>
                          {log.status}
                        </span>
                        {log.errorMessage && <p className="text-xs text-rose-500">{log.errorMessage}</p>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={templateOpen} onClose={() => setTemplateOpen(false)} title="New Message Template">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              await templateMutations.create.mutateAsync({
                name: fd.get("name"),
                channel: fd.get("channel"),
                subject: fd.get("subject") || undefined,
                bodyText: fd.get("bodyText"),
                bodyHtml: fd.get("channel") === "email" ? fd.get("bodyText") : undefined,
                status: "ACTIVE",
              });
              toast.success("Template created");
              setTemplateOpen(false);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        >
          <div><Label>Name *</Label><Input name="name" required /></div>
          <div>
            <Label>Channel *</Label>
            <Select name="channel" defaultValue="email">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </Select>
          </div>
          <div><Label>Subject (email)</Label><Input name="subject" placeholder="Hello {{name}}" /></div>
          <div>
            <Label>Body *</Label>
            <textarea name="bodyText" required rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Hi {{name}}, ..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setTemplateOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 text-white">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={sequenceOpen} onClose={() => setSequenceOpen(false)} title="New Communication Sequence">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const templateId = fd.get("templateId") as string;
            if (!templateId) return toast.error("Select a template");
            try {
              await sequenceMutations.create.mutateAsync({
                name: fd.get("name"),
                triggerEvent: fd.get("triggerEvent") || "lead.created",
                status: "ACTIVE",
                steps: [{ templateId, delayMinutes: Number(fd.get("delayMinutes") ?? 0) }],
              });
              toast.success("Sequence created");
              setSequenceOpen(false);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        >
          <div><Label>Name *</Label><Input name="name" required placeholder="Welcome drip" /></div>
          <div><Label>Trigger event</Label><Input name="triggerEvent" defaultValue="lead.created" /></div>
          <div>
            <Label>First template *</Label>
            <Select name="templateId" required defaultValue="">
              <option value="">Select template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>
              ))}
            </Select>
          </div>
          <div><Label>Delay (minutes)</Label><Input name="delayMinutes" type="number" defaultValue={0} min={0} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSequenceOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 text-white">Create</Button>
          </div>
        </form>
      </Modal>

      <p className="text-sm text-slate-500">
        <Link href="/app/sales/leads" className="text-indigo-600 hover:underline">Leads</Link>
        {" · "}
        <Link href="/app/sales/automation" className="text-indigo-600 hover:underline">Automation</Link>
      </p>
    </div>
  );
}

function LoaderRow() {
  return (
    <div className="flex gap-2 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
    </div>
  );
}
