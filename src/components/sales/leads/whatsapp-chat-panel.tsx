"use client";

import { useState } from "react";
import { Loader2, Mail, MessageSquare, Phone, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWhatsAppChat, useWhatsAppMutations } from "@/hooks/sales/crm";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  phone: string;
};

export function WhatsAppChatPanel({ open, onClose, leadId, leadName, phone }: Props) {
  const { data, isLoading } = useWhatsAppChat(leadId, open);
  const { send, summarize } = useWhatsAppMutations(leadId);
  const [draft, setDraft] = useState("");

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    try {
      await send.mutateAsync(text);
      setDraft("");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSummarize = async () => {
    try {
      const result = await summarize.mutateAsync();
      toast.success("Conversation summarized");
      return result;
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (!open) return null;

  const configActive = data?.config?.is_active;
  const conversation = data?.conversation;
  const messages = data?.messages ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-label="Close chat" />
      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                <WhatsAppIcon size={16} />
              </span>
              WhatsApp · {leadName}
            </p>
            <p className="truncate text-xs text-slate-500">{phone}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </header>

        {!configActive && (
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            WhatsApp Business API is not active.{" "}
            <a href="/app/setup/organisation/whatsapp" className="font-medium underline">
              Configure credentials
            </a>{" "}
            and enable the integration to send or receive messages.
          </div>
        )}

        {configActive && (
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-600">
            Replies from the lead appear here when your Meta webhook points to this app. Outbound messages
            require an open 24-hour window unless you use an approved template.
          </div>
        )}

        {conversation?.aiMode === "human" && (
          <div className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-800">
            AI flagged this conversation for human follow-up.
          </div>
        )}

        {conversation?.summary && (
          <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-xs text-indigo-900">
            <span className="font-semibold">AI summary:</span> {conversation.summary}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No messages yet. Start the conversation below.</p>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={cn("flex", m.direction === "outbound" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      m.direction === "outbound"
                        ? "rounded-br-sm bg-emerald-600 text-white"
                        : "rounded-bl-sm bg-slate-100 text-slate-900"
                    )}
                  >
                    <p>{m.body}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        m.direction === "outbound" ? "text-emerald-100" : "text-slate-400"
                      )}
                    >
                      {m.senderType === "ai" && "AI · "}
                      {m.direction === "outbound" && (
                        <span>{m.delivered ? "Sent · " : "Not delivered · "}</span>
                      )}
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-slate-200 p-3">
          <div className="mb-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={summarize.isPending || messages.length === 0}
              onClick={handleSummarize}
            >
              {summarize.isPending ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Sparkles size={12} className="mr-1" />}
              AI Summarize
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={configActive ? "Type a message…" : "Configure WhatsApp API to send messages"}
              disabled={!configActive}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <Button
              type="button"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
              disabled={!configActive || !draft.trim() || send.isPending}
              onClick={handleSend}
            >
              {send.isPending ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
            </Button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
