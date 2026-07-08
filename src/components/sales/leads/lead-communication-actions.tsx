"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ExternalLink, Loader2, Mail, MessageSquare, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useDograhCall, useLeadEngagements, useLogLeadEngagement, useWhatsAppMutations } from "@/hooks/sales/crm";
import { parseWhatsAppPhone } from "@/lib/sales/whatsapp-phone";
import { cn } from "@/lib/utils";
import { WhatsAppChatPanel } from "@/components/sales/leads/whatsapp-chat-panel";

function WhatsAppIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const CHANNEL_META = {
  call: { label: "Call", icon: Phone, color: "bg-emerald-600 hover:bg-emerald-700" },
  sms: { label: "SMS", icon: MessageSquare, color: "bg-sky-600 hover:bg-sky-700" },
  email: { label: "Email", icon: Mail, color: "bg-indigo-600 hover:bg-indigo-700" },
  whatsapp: { label: "WhatsApp", icon: WhatsAppIcon, color: "bg-green-600 hover:bg-green-700" },
} as const;

type Channel = keyof typeof CHANNEL_META;

type Props = {
  leadId: string;
  leadName: string;
  phone?: string | null;
  email?: string | null;
};

export function LeadCommunicationActions({ leadId, leadName, phone, email }: Props) {
  const { data } = useLeadEngagements(leadId);
  const logEngagement = useLogLeadEngagement(leadId);
  const { validate: validateWhatsApp } = useWhatsAppMutations(leadId);
  const aiCall = useDograhCall(leadId);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [validatedPhone, setValidatedPhone] = useState<string | null>(null);

  const counts = data?.counts ?? { call: 0, sms: 0, email: 0, whatsapp: 0 };
  const history = data?.history ?? [];

  const track = async (channel: Channel, action = "click") => {
    try {
      await logEngagement.mutateAsync({ channel, action });
    } catch {
      /* non-blocking */
    }
  };

  const handleCall = async () => {
    if (!phone) return;
    await track("call");
    window.location.href = `tel:${phone}`;
  };

  const handleSms = async () => {
    if (!phone) return;
    await track("sms");
    window.location.href = `sms:${phone}`;
  };

  const handleEmail = async () => {
    if (!email) return;
    await track("email");
    window.location.href = `mailto:${email}`;
  };

  const handleWhatsApp = async () => {
    if (!phone) return;

    const parsed = parseWhatsAppPhone(phone);
    if (!parsed.valid) {
      toast.error(parsed.error ?? "Invalid phone number.");
      return;
    }

    try {
      const result = await validateWhatsApp.mutateAsync(phone);
      setValidatedPhone(result.display ?? parsed.display);
      await track("whatsapp", "open_chat");
      setWhatsappOpen(true);
    } catch (err) {
      toast.error((err as Error).message || "This phone number is not registered on WhatsApp.");
    }
  };

  const handleAiCall = async () => {
    if (!phone) return;
    try {
      const result = await aiCall.mutateAsync();
      toast.success(`AI call started${result.callId ? ` (${result.callId})` : ""}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to start AI call.");
    }
  };

  const whatsappValidating = validateWhatsApp.isPending;

  const actions: { channel: Channel; enabled: boolean; onClick: () => void }[] = [
    { channel: "call", enabled: !!phone, onClick: handleCall },
    { channel: "sms", enabled: !!phone, onClick: handleSms },
    { channel: "email", enabled: !!email, onClick: handleEmail },
    { channel: "whatsapp", enabled: !!phone, onClick: handleWhatsApp },
  ];

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
          <Link
            href={`/app/sales/leads/communication-history?leadId=${leadId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
          >
            Full history <ExternalLink size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {actions.map(({ channel, enabled, onClick }) => {
            const meta = CHANNEL_META[channel];
            const Icon = meta.icon;
            const loading = channel === "whatsapp" && whatsappValidating;
            return (
              <button
                key={channel}
                type="button"
                disabled={!enabled || loading}
                onClick={onClick}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium text-white transition-opacity sm:text-sm",
                  enabled && !loading ? meta.color : "cursor-not-allowed bg-slate-200 text-slate-400"
                )}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
                <span className="truncate">{meta.label}</span>
                {counts[channel] > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-slate-700 shadow">
                    {counts[channel]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!phone || aiCall.isPending}
          onClick={handleAiCall}
          className={cn(
            "mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-opacity",
            phone && !aiCall.isPending
              ? "bg-violet-600 hover:bg-violet-700"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          )}
        >
          {aiCall.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Start AI Call
        </button>

        {history.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <AlertCircle size={12} /> Contact history
            </p>
            <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-slate-600">
              {history.slice(0, 8).map((h, i) => (
                <li key={h.id ?? `${h.channel}-${h.createdAt}-${i}`} className="flex justify-between gap-2">
                  <span className="capitalize">
                    {h.channel} · {h.action.replace(/_/g, " ")}
                  </span>
                  <span className="shrink-0 text-slate-400">{new Date(h.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            {history.length > 0 && (
              <p className="mt-2 text-[11px] text-amber-700">
                Follow-up reminder scheduled 3 days after last contact if lead is still open.
              </p>
            )}
          </div>
        )}
      </section>

      {phone && (
        <WhatsAppChatPanel
          open={whatsappOpen}
          onClose={() => setWhatsappOpen(false)}
          leadId={leadId}
          leadName={leadName}
          phone={validatedPhone ?? phone}
        />
      )}
    </>
  );
}
