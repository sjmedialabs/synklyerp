"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Copy, ExternalLink, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useWhatsAppConfig, useWhatsAppConfigMutations } from "@/hooks/organisation-setup";
import type { WhatsAppConfigInput } from "@/validators/whatsapp-config";

const TOKEN_PLACEHOLDER = "••••••••••••••••";

type FormState = WhatsAppConfigInput & { accessToken: string };

const EMPTY_FORM: FormState = {
  phoneNumberId: "",
  businessAccountId: "",
  accessToken: "",
  webhookVerifyToken: "",
  isActive: false,
};

export default function WhatsAppConfigPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { data, isPending, isError, error, isFetching } = useWhatsAppConfig();
  const { save, test } = useWhatsAppConfigMutations();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [tokenSet, setTokenSet] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!data?.config) return;
    const c = data.config;
    setForm({
      phoneNumberId: c.phoneNumberId ?? "",
      businessAccountId: c.businessAccountId ?? "",
      accessToken: c.accessTokenSet ? TOKEN_PLACEHOLDER : "",
      webhookVerifyToken: c.webhookVerifyToken ?? "",
      isActive: c.isActive,
    });
    setTokenSet(c.accessTokenSet);
  }, [data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "accessToken" && value !== TOKEN_PLACEHOLDER) {
      setTokenSet(false);
    }
  };

  const handleTest = async () => {
    try {
      const result = await test.mutateAsync({
        phoneNumberId: form.phoneNumberId.trim(),
        businessAccountId: form.businessAccountId.trim() || undefined,
        accessToken: form.accessToken !== TOKEN_PLACEHOLDER ? form.accessToken : undefined,
      });
      const label = result.displayPhoneNumber ?? result.verifiedName ?? "Connected";
      toast.success(`WhatsApp API OK — ${label}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSave = async () => {
    try {
      const payload: WhatsAppConfigInput & { accessToken?: string } = {
        phoneNumberId: form.phoneNumberId.trim(),
        businessAccountId: form.businessAccountId.trim(),
        webhookVerifyToken: form.webhookVerifyToken.trim(),
        isActive: form.isActive,
      };

      if (form.accessToken && form.accessToken !== TOKEN_PLACEHOLDER) {
        payload.accessToken = form.accessToken.trim();
      }

      await save.mutateAsync(payload);
      toast.success("WhatsApp API configuration saved");
      if (payload.accessToken) {
        setForm((prev) => ({ ...prev, accessToken: TOKEN_PLACEHOLDER }));
        setTokenSet(true);
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const copyWebhookUrl = async () => {
    if (!webhookUrl) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const showInitialLoader = sessionStatus === "loading" || (isPending && !data && !isError);

  if (showInitialLoader) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const webhookUrl =
    data?.webhookUrl ??
    (typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/whatsapp` : "");

  return (
    <div>
      <PageHeader
        title="WhatsApp Business API"
        description="Connect your Meta WhatsApp Business account for lead messaging, number validation, and inbound webhooks."
      />

      {!isAdmin && (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Only organisation admins can update WhatsApp API settings.
        </p>
      )}

      {isError && (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error)?.message ?? "Could not load WhatsApp configuration."}
        </p>
      )}

      {data?.migrationRequired && (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Database migration <strong>024</strong> is not applied yet. Run{" "}
          <code className="rounded bg-amber-100 px-1">npm run db:apply:024</code> or execute{" "}
          <code className="rounded bg-amber-100 px-1">supabase/migrations/024_crm_lead_engagement_whatsapp.sql</code> in
          Supabase SQL editor, then refresh.
        </p>
      )}

      <div className="w-full space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            API credentials
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="phoneNumberId">Phone number ID</Label>
              <Input
                id="phoneNumberId"
                value={form.phoneNumberId}
                onChange={(e) => set("phoneNumberId", e.target.value)}
                placeholder="Meta → WhatsApp → API Setup"
                disabled={!isAdmin}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-slate-500">
                From Meta Developer → WhatsApp → API Setup. <strong>Not</strong> the App ID or WABA ID.
              </p>
            </div>

            <div>
              <Label htmlFor="businessAccountId">Business account ID (WABA)</Label>
              <Input
                id="businessAccountId"
                value={form.businessAccountId}
                onChange={(e) => set("businessAccountId", e.target.value)}
                placeholder="WhatsApp Business Account ID"
                disabled={!isAdmin}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-slate-500">Your WhatsApp Business Account identifier.</p>
            </div>

            <div>
              <Label htmlFor="accessToken">Permanent access token</Label>
              <Input
                id="accessToken"
                type="password"
                value={form.accessToken}
                onChange={(e) => set("accessToken", e.target.value)}
                placeholder={tokenSet ? "Token saved — paste to replace" : "System user or permanent token"}
                disabled={!isAdmin}
                autoComplete="off"
                className="mt-1.5"
              />
              {tokenSet && form.accessToken === TOKEN_PLACEHOLDER ? (
                <p className="mt-1 text-xs text-emerald-600">Token stored. Leave masked to keep, or paste new to replace.</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">Permanent token from Meta Business settings.</p>
              )}
            </div>

            <div>
              <Label htmlFor="webhookVerifyToken">Webhook verify token</Label>
              <Input
                id="webhookVerifyToken"
                value={form.webhookVerifyToken}
                onChange={(e) => set("webhookVerifyToken", e.target.value)}
                placeholder="Secret for Meta webhook verification"
                disabled={!isAdmin}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-slate-500">Same value used in Meta Developer Console webhook setup.</p>
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
            Enable WhatsApp integration
          </label>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Webhook configuration</h2>
          <p className="mb-4 text-sm text-slate-600">
            In Meta Developer Console, set your webhook callback URL and subscribe to <strong>messages</strong>.
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <Label>Callback URL</Label>
              <Input readOnly value={webhookUrl} className="mt-1.5 font-mono text-xs" />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" className="w-full" onClick={copyWebhookUrl}>
                {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                Copy URL
              </Button>
            </div>
          </div>

          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
          >
            Meta WhatsApp Cloud API docs <ExternalLink size={14} />
          </a>
        </section>

        {isAdmin && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <Button
              type="button"
              variant="outline"
              disabled={test.isPending || !form.phoneNumberId.trim() || data?.migrationRequired}
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
