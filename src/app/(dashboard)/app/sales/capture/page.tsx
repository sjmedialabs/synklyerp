"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Loader2, Key, Webhook, FileInput, Radio, ScrollText, Activity } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  useCaptureApiKeyMutations,
  useCaptureApiKeys,
  useCaptureFormMutations,
  useCaptureForms,
  useCaptureWebhookMutations,
  useCaptureWebhooks,
  useApiLogs,
  useWebhookLogs,
  useLeadSourceMutations,
  useLeadSources,
  useSourceTypes,
} from "@/hooks/sales/crm";

type Tab = "sources" | "api-keys" | "forms" | "webhooks" | "api-logs" | "webhook-logs";

export default function LeadCaptureHubPage() {
  const [tab, setTab] = useState<Tab>("sources");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<{ apiKey: string; apiSecret: string } | null>(null);

  const { data: sources = [], isLoading: sourcesLoading } = useLeadSources();
  const { data: sourceTypes = [] } = useSourceTypes();
  const { data: apiKeys = [], isLoading: keysLoading } = useCaptureApiKeys();
  const { data: forms = [], isLoading: formsLoading } = useCaptureForms();
  const { data: webhooks = [], isLoading: webhooksLoading } = useCaptureWebhooks();
  const { data: apiLogs = [], isLoading: apiLogsLoading } = useApiLogs();
  const { data: webhookLogs = [], isLoading: webhookLogsLoading } = useWebhookLogs();
  const sourceMutations = useLeadSourceMutations();
  const apiKeyMutations = useCaptureApiKeyMutations();
  const formMutations = useCaptureFormMutations();
  const webhookMutations = useCaptureWebhookMutations();

  const tabs: { id: Tab; label: string; icon: typeof Radio }[] = [
    { id: "sources", label: "Lead Sources", icon: Radio },
    { id: "api-keys", label: "Capture APIs", icon: Key },
    { id: "forms", label: "Embed Forms", icon: FileInput },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "api-logs", label: "API Logs", icon: ScrollText },
    { id: "webhook-logs", label: "Webhook Logs", icon: Activity },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lead Capture Hub"
        description="Central entry point for website forms, ads, APIs, webhooks, and partner integrations."
        badge={
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
            Enterprise CRM
          </span>
        }
        actions={
          tab === "sources" ? (
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setSourceOpen(true)}>
              <Plus size={16} className="mr-2" /> New Source
            </Button>
          ) : tab === "api-keys" ? (
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setApiKeyOpen(true)}>
              <Plus size={16} className="mr-2" /> New API Key
            </Button>
          ) : tab === "forms" ? (
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setFormOpen(true)}>
              <Plus size={16} className="mr-2" /> New Form
            </Button>
          ) : tab === "webhooks" ? (
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setWebhookOpen(true)}>
              <Plus size={16} className="mr-2" /> New Webhook
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === id
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "sources" && (
        <>
          {sourcesLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading sources...
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  {["Name", "Type", "Status", "Health", "Total Leads", "Success", "Failed", "Last Sync"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sources.length === 0 && !sourcesLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      No lead sources yet. Create your first capture channel.
                    </td>
                  </tr>
                ) : (
                  sources.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3">{s.sourceTypeCode.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">{s.status}</td>
                      <td className="px-4 py-3 capitalize">{s.healthStatus}</td>
                      <td className="px-4 py-3">{s.totalLeads}</td>
                      <td className="px-4 py-3">{s.successfulRequests}</td>
                      <td className="px-4 py-3">{s.failedRequests}</td>
                      <td className="px-4 py-3">
                        {s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "api-keys" && (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/50">
            <p className="font-medium text-slate-900 dark:text-white">Public ingestion endpoint</p>
            <code className="mt-1 block text-indigo-700 dark:text-indigo-300">POST /api/v1/public/leads</code>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Authenticate with <code>Authorization: Bearer &lt;api-key&gt;</code> or <code>X-API-Key</code> header.
            </p>
          </div>
          {keysLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading API keys...
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  {["Name", "Prefix", "Method", "Status", "Rate Limit", "Last Used", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-medium">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{k.keyPrefix}…</td>
                    <td className="px-4 py-3">{k.authMethod}</td>
                    <td className="px-4 py-3">{k.status}</td>
                    <td className="px-4 py-3">{k.rateLimitPerMinute}/min</td>
                    <td className="px-4 py-3">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">
                      {k.status === "ACTIVE" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            apiKeyMutations.revoke.mutate(k.id, {
                              onSuccess: () => toast.success("API key revoked"),
                              onError: (e) => toast.error(e.message),
                            })
                          }
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "forms" && (
        <>
          {formsLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading forms...
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  {["Name", "Status", "Views", "Submissions", "Conversion", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forms.length === 0 && !formsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      No embed forms yet. Create one to capture leads from your website.
                    </td>
                  </tr>
                ) : (
                  forms.map((f) => (
                    <tr key={f.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium">{f.name}</td>
                      <td className="px-4 py-3">{f.status}</td>
                      <td className="px-4 py-3">{f.viewCount}</td>
                      <td className="px-4 py-3">{f.submissionCount}</td>
                      <td className="px-4 py-3">
                        {f.viewCount > 0 ? `${Math.round((f.submissionCount / f.viewCount) * 100)}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/app/sales/capture/forms/${f.id}`} className="text-indigo-600 hover:underline">
                          Edit builder
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "webhooks" && (
        <>
          {webhooksLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading webhooks...
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  {["Name", "URL", "Events", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {webhooks.length === 0 && !webhooksLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      No outbound webhooks. Add one to notify external systems on lead.created events.
                    </td>
                  </tr>
                ) : (
                  webhooks.map((w) => (
                    <tr key={w.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium">{w.name}</td>
                      <td className="px-4 py-3 max-w-xs truncate font-mono text-xs">{w.url}</td>
                      <td className="px-4 py-3">{w.events.join(", ")}</td>
                      <td className="px-4 py-3">{w.status}</td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            webhookMutations.test.mutate(w.id, {
                              onSuccess: () => toast.success("Test payload sent"),
                              onError: (e) => toast.error(e.message),
                            })
                          }
                        >
                          Test
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "api-logs" && (
        <>
          {apiLogsLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading API logs...
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  {["Time", "Method", "Path", "Status", "Duration", "IP", "Error"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apiLogs.length === 0 && !apiLogsLoading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No API requests logged yet.</td></tr>
                ) : (
                  apiLogs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.method}</td>
                      <td className="px-4 py-3 font-mono text-xs max-w-xs truncate">{log.path}</td>
                      <td className="px-4 py-3">
                        <span className={log.statusCode >= 400 ? "text-rose-600" : "text-emerald-600"}>{log.statusCode}</span>
                      </td>
                      <td className="px-4 py-3">{log.processingMs != null ? `${log.processingMs}ms` : "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.ipAddress ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-rose-600 max-w-xs truncate">{log.errorMessage ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "webhook-logs" && (
        <>
          {webhookLogsLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading webhook logs...
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  {["Time", "Event", "Status", "Attempt", "Delivered", "Error"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {webhookLogs.length === 0 && !webhookLogsLoading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No webhook deliveries logged yet.</td></tr>
                ) : (
                  webhookLogs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">{log.eventType}</td>
                      <td className="px-4 py-3">
                        <span className={log.responseStatus != null && log.responseStatus >= 400 ? "text-rose-600" : "text-emerald-600"}>
                          {log.responseStatus ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{log.attempt}</td>
                      <td className="px-4 py-3">{log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-xs text-rose-600 max-w-xs truncate">{log.errorMessage ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={sourceOpen} onClose={() => setSourceOpen(false)} title="New Lead Source">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              await sourceMutations.create.mutateAsync({
                name: fd.get("name"),
                sourceTypeCode: fd.get("sourceTypeCode"),
                description: fd.get("description") || undefined,
                status: "ACTIVE",
              });
              toast.success("Lead source created");
              setSourceOpen(false);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        >
          <div>
            <Label>Name *</Label>
            <Input name="name" required placeholder="Website contact form" />
          </div>
          <div>
            <Label>Source type *</Label>
            <Select name="sourceTypeCode" required defaultValue="">
              <option value="">Select type...</option>
              {sourceTypes.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Input name="description" placeholder="Optional description" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSourceOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 text-white">
              Create source
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={apiKeyOpen}
        onClose={() => {
          setApiKeyOpen(false);
          setCreatedKey(null);
        }}
        title={createdKey ? "API Key Created" : "New Capture API Key"}
      >
        {createdKey ? (
          <div className="space-y-3 text-sm">
            <p className="text-amber-700 dark:text-amber-300">Copy this key now — it won&apos;t be shown again.</p>
            <div className="rounded-lg bg-slate-100 p-3 font-mono text-xs break-all dark:bg-slate-800">{createdKey.apiKey}</div>
            <Button type="button" className="w-full bg-indigo-600 text-white" onClick={() => navigator.clipboard.writeText(createdKey.apiKey)}>
              Copy to clipboard
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              try {
                const result = await apiKeyMutations.create.mutateAsync({
                  name: fd.get("name"),
                  authMethod: fd.get("authMethod") || "bearer",
                });
                setCreatedKey({ apiKey: result.apiKey, apiSecret: result.apiSecret });
                toast.success("API key created");
              } catch (err) {
                toast.error((err as Error).message);
              }
            }}
          >
            <div>
              <Label>Name *</Label>
              <Input name="name" required placeholder="Website production key" />
            </div>
            <div>
              <Label>Authentication</Label>
              <Select name="authMethod" defaultValue="bearer">
                <option value="bearer">Bearer Token</option>
                <option value="api_key">API Key Header</option>
                <option value="hmac">HMAC</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setApiKeyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 text-white">
                Generate key
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="New Embed Form">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              const form = await formMutations.create.mutateAsync({
                name: fd.get("name"),
                status: "DRAFT",
                successMessage: fd.get("successMessage") || "Thank you! We'll be in touch soon.",
              });
              toast.success("Form created");
              setFormOpen(false);
              window.location.href = `/app/sales/capture/forms/${form.id}`;
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        >
          <div>
            <Label>Name *</Label>
            <Input name="name" required placeholder="Website contact form" />
          </div>
          <div>
            <Label>Success message</Label>
            <Input name="successMessage" placeholder="Thank you for contacting us!" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 text-white">Create form</Button>
          </div>
        </form>
      </Modal>

      <Modal open={webhookOpen} onClose={() => setWebhookOpen(false)} title="New Outbound Webhook">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              await webhookMutations.create.mutateAsync({
                name: fd.get("name"),
                url: fd.get("url"),
                events: ["lead.created"],
                payloadFormat: "json",
                status: "ACTIVE",
              });
              toast.success("Webhook created");
              setWebhookOpen(false);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        >
          <div>
            <Label>Name *</Label>
            <Input name="name" required placeholder="CRM sync webhook" />
          </div>
          <div>
            <Label>Endpoint URL *</Label>
            <Input name="url" type="url" required placeholder="https://example.com/webhooks/leads" />
          </div>
          <p className="text-xs text-slate-500">Fires on <code>lead.created</code> with JSON payload.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setWebhookOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 text-white">Create webhook</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
