"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bot, Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useDograhConfig, useDograhConfigMutations } from "@/hooks/organisation-setup";
import type { DograhConfigInput } from "@/validators/dograh-config";

const TOKEN_PLACEHOLDER = "••••••••••••••••";

type FormState = DograhConfigInput & { apiKey: string };

const EMPTY_FORM: FormState = {
  serverUrl: "",
  apiKey: "",
  publicAppUrl: "",
  agentTriggerUuid: "",
  telephonyConfigurationId: null,
  isActive: false,
};

export default function DograhConfigPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { data, isPending, isError, error, isFetching } = useDograhConfig();
  const { save, test } = useDograhConfigMutations();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [keySet, setKeySet] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const c = data.config;
    setForm({
      serverUrl: c?.serverUrl ?? data.envFallback.serverUrl ?? "",
      apiKey: c?.apiKeySet || data.envFallback.apiKeySet ? TOKEN_PLACEHOLDER : "",
      publicAppUrl: c?.publicAppUrl ?? data.envFallback.publicAppUrl ?? "",
      agentTriggerUuid: c?.agentTriggerUuid ?? data.envFallback.agentTriggerUuid ?? "",
      telephonyConfigurationId:
        c?.telephonyConfigurationId ?? data.envFallback.telephonyConfigurationId ?? null,
      isActive: c?.isActive ?? false,
    });
    setKeySet(!!(c?.apiKeySet || data.envFallback.apiKeySet));
  }, [data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "apiKey" && value !== TOKEN_PLACEHOLDER) setKeySet(false);
  };

  const handleTest = async () => {
    try {
      const result = await test.mutateAsync({
        serverUrl: form.serverUrl.trim() || undefined,
        apiKey: form.apiKey !== TOKEN_PLACEHOLDER ? form.apiKey : undefined,
        agentTriggerUuid: form.agentTriggerUuid.trim() || undefined,
      });
      toast.success(result.message);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSave = async () => {
    try {
      const payload: DograhConfigInput & { apiKey?: string } = {
        serverUrl: form.serverUrl.trim(),
        publicAppUrl: form.publicAppUrl.trim(),
        agentTriggerUuid: form.agentTriggerUuid.trim(),
        telephonyConfigurationId: form.telephonyConfigurationId,
        isActive: form.isActive,
      };
      if (form.apiKey && form.apiKey !== TOKEN_PLACEHOLDER) {
        payload.apiKey = form.apiKey.trim();
      }
      await save.mutateAsync(payload);
      toast.success("Dograh configuration saved");
      if (payload.apiKey) {
        setForm((prev) => ({ ...prev, apiKey: TOKEN_PLACEHOLDER }));
        setKeySet(true);
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 2000);
  };

  const showInitialLoader = sessionStatus === "loading" || (isPending && !data && !isError);

  if (showInitialLoader) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const customerUrl = data?.customerUrl ?? "";
  const webhookUrl = data?.webhookUrl ?? "";
  const updateStatusUrl = data?.updateStatusUrl ?? "";
  const webhookPayloadTemplate = data?.webhookPayloadTemplate ?? "";

  return (
    <div>
      <PageHeader
        title="Dograh AI Voice"
        description="Connect your self-hosted Dograh server for AI outbound calls, live customer context, and post-call transcripts."
      />

      {!isAdmin && (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Only organisation admins can update Dograh settings.
        </p>
      )}

      {isError && (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error)?.message ?? "Could not load Dograh configuration."}
        </p>
      )}

      {data?.migrationRequired && (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Database migration <strong>026</strong> is not applied yet. Run{" "}
          <code className="rounded bg-amber-100 px-1">npm run db:apply:026</code> or execute{" "}
          <code className="rounded bg-amber-100 px-1">supabase/migrations/026_crm_dograh_config_property_fields.sql</code>{" "}
          in Supabase SQL editor, then refresh.
        </p>
      )}

      <div className="w-full space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Bot className="h-5 w-5 text-violet-600" />
            Server credentials
          </h2>

          {data?.envFallback.serverUrl && !data.config?.serverUrl && (
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Using global <code>DOGRAH_URL</code> from environment: {data.envFallback.serverUrl}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="serverUrl">Dograh server URL</Label>
              <Input
                id="serverUrl"
                value={form.serverUrl}
                onChange={(e) => set("serverUrl", e.target.value)}
                placeholder="https://ai.yourdomain.com"
                disabled={!isAdmin}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-slate-500">Your Dograh Docker instance base URL.</p>
            </div>

            <div>
              <Label htmlFor="apiKey">API key</Label>
              <Input
                id="apiKey"
                type="password"
                value={form.apiKey}
                onChange={(e) => set("apiKey", e.target.value)}
                placeholder={keySet ? "Key saved — paste to replace" : "Dograh API key (dgr_...)"}
                disabled={!isAdmin}
                autoComplete="off"
                className="mt-1.5"
              />
              {keySet && form.apiKey === TOKEN_PLACEHOLDER ? (
                <p className="mt-1 text-xs text-emerald-600">API key stored. Leave masked to keep, or paste new to replace.</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">Can also be set globally via DOGRAH_API_KEY.</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <Label htmlFor="publicAppUrl">Public app URL</Label>
              <Input
                id="publicAppUrl"
                value={form.publicAppUrl}
                onChange={(e) => set("publicAppUrl", e.target.value)}
                placeholder="https://your-synkly-domain.com"
                disabled={!isAdmin}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-slate-500">
                Dograh calls this URL for customer context and webhooks. Must be reachable from your VPS.
              </p>
            </div>

            <div className="lg:col-span-2">
              <Label htmlFor="agentTriggerUuid">API Trigger UUID</Label>
              <Input
                id="agentTriggerUuid"
                value={form.agentTriggerUuid}
                onChange={(e) => set("agentTriggerUuid", e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                disabled={!isAdmin}
                className="mt-1.5 font-mono text-xs"
              />
              <p className="mt-1 text-xs text-slate-500">
                Copy from Dograh workflow → API Trigger node → Production URL. Required for outbound calls.
              </p>
            </div>

            <div>
              <Label htmlFor="telephonyConfigurationId">Telephony config ID (optional)</Label>
              <Input
                id="telephonyConfigurationId"
                type="number"
                value={form.telephonyConfigurationId ?? ""}
                onChange={(e) =>
                  set(
                    "telephonyConfigurationId",
                    e.target.value.trim() ? Number(e.target.value) : null
                  )
                }
                placeholder="e.g. 1"
                disabled={!isAdmin}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-slate-500">Use when you have multiple Dograh telephony providers.</p>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              disabled={!isAdmin}
              className="rounded border-slate-300"
            />
            Enable Dograh AI Voice integration
          </label>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Dograh integration endpoints</h2>
          <p className="mb-4 text-sm text-slate-600">
            Configure these in your Dograh workflow. Use the customer URL for Pre-Call Data Fetch (POST) on the Start
            Call node, and the webhook URL on the Webhook node.
          </p>

          <div className="space-y-4">
            {[
              {
                label: "Customer context (POST/GET)",
                value: customerUrl,
                hint: "Pre-Call Data Fetch endpoint in Dograh Start Call node",
              },
              { label: "Post-call webhook (POST)", value: webhookUrl, hint: "Webhook node destination URL" },
              { label: "Status update (POST)", value: updateStatusUrl, hint: "Optional mid-call status updates" },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-1 gap-2 lg:grid-cols-4">
                <div className="lg:col-span-3">
                  <Label>{row.label}</Label>
                  <Input readOnly value={row.value} className="mt-1.5 font-mono text-xs" />
                  <p className="mt-1 text-xs text-slate-500">{row.hint}</p>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!row.value}
                    onClick={() => copyText(row.value, row.label)}
                  >
                    {copied === row.label ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                    Copy
                  </Button>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
              <div className="lg:col-span-3">
                <Label>Recommended webhook payload</Label>
                <textarea
                  readOnly
                  value={webhookPayloadTemplate}
                  className="mt-1.5 min-h-[180px] w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Paste into Dograh Webhook node payload template. Authenticate with your SynklyERP API key.
                </p>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!webhookPayloadTemplate}
                  onClick={() => copyText(webhookPayloadTemplate, "Webhook payload")}
                >
                  {copied === "Webhook payload" ? (
                    <Check size={16} className="mr-2" />
                  ) : (
                    <Copy size={16} className="mr-2" />
                  )}
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </section>

        {isAdmin && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <Button
              type="button"
              variant="outline"
              disabled={test.isPending || data?.migrationRequired}
              onClick={handleTest}
            >
              {test.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Test connection
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={save.isPending || data?.migrationRequired}
              onClick={handleSave}
            >
              {save.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Save configuration
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
