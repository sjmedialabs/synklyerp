import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { generateChatSummary, maybeAutoReply } from "@/lib/sales/whatsapp-ai";
import { parseWhatsAppPhone, type WhatsAppValidationResult } from "@/lib/sales/whatsapp-phone";
import { parseGraphApiError, whatsAppGraphUrl } from "@/lib/sales/whatsapp-graph";

function normalizeConversationPhone(phone: string) {
  const parsed = parseWhatsAppPhone(phone);
  return parsed.valid ? parsed.normalized : phone.replace(/\D/g, "");
}

export async function getOrCreateConversation(tenantId: string, leadId: string, phone: string) {
  const supabase = createAdminClient();
  const normalizedPhone = normalizeConversationPhone(phone);
  const { data: existing, error: existingErr } = await supabase
    .from("crm_whatsapp_conversations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("lead_id", leadId)
    .maybeSingle();

  if (existingErr && isMissingSchemaError(existingErr)) throw new Error("SCHEMA_NOT_MIGRATED");
  if (existing) {
    if (existing.phone !== normalizedPhone) {
      await supabase
        .from("crm_whatsapp_conversations")
        .update({ phone: normalizedPhone })
        .eq("id", existing.id);
    }
    return mapConversation({ ...existing, phone: normalizedPhone });
  }

  const { data, error } = await supabase
    .from("crm_whatsapp_conversations")
    .insert({
      tenant_id: tenantId,
      lead_id: leadId,
      phone: normalizedPhone,
    })
    .select("*")
    .single();
  if (error) {
    if (isMissingSchemaError(error)) throw new Error("SCHEMA_NOT_MIGRATED");
    throw error;
  }
  return mapConversation(data);
}

export async function listMessages(tenantId: string, conversationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_whatsapp_messages")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data ?? []).map(mapMessage);
}

export async function sendWhatsAppMessage(input: {
  tenantId: string;
  conversationId: string;
  leadId: string;
  phone: string;
  body: string;
  senderType?: "human" | "ai" | "system";
  userId?: string | null;
}) {
  const parsed = parseWhatsAppPhone(input.phone);
  if (!parsed.valid) {
    throw new Error(parsed.error ?? "Invalid phone number.");
  }

  const supabase = createAdminClient();
  const { data: config } = await supabase
    .from("crm_whatsapp_tenant_config")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .maybeSingle();

  if (!config?.is_active || !config.phone_number_id || !config.access_token) {
    throw new Error(
      "WhatsApp Business API is not configured. Set up credentials under Organisation → WhatsApp."
    );
  }

  const res = await fetch(whatsAppGraphUrl(`${config.phone_number_id}/messages`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: parsed.normalized,
      type: "text",
      text: { body: input.body },
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(parseGraphApiError(json));
  }

  const externalId = (json as { messages?: { id: string }[] }).messages?.[0]?.id ?? null;
  if (!externalId) {
    throw new Error("WhatsApp API did not return a message ID. The message may not have been sent.");
  }

  const { data, error } = await supabase
    .from("crm_whatsapp_messages")
    .insert({
      tenant_id: input.tenantId,
      conversation_id: input.conversationId,
      direction: "outbound",
      body: input.body,
      sender_type: input.senderType ?? "human",
      external_id: externalId,
      metadata: { userId: input.userId },
    })
    .select("*")
    .single();
  if (error) throw error;

  await supabase
    .from("crm_whatsapp_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", input.conversationId);

  return mapMessage(data);
}

export async function summarizeConversation(tenantId: string, conversationId: string) {
  const messages = await listMessages(tenantId, conversationId);
  const summary = generateChatSummary(messages);
  const supabase = createAdminClient();
  await supabase.from("crm_whatsapp_conversations").update({ summary }).eq("id", conversationId);
  return summary;
}

export async function processInboundMessage(input: {
  tenantId: string;
  conversationId: string;
  leadId: string;
  phone: string;
  body: string;
  externalId?: string | null;
}) {
  const supabase = createAdminClient();

  if (input.externalId) {
    const { data: existing } = await supabase
      .from("crm_whatsapp_messages")
      .select("id")
      .eq("tenant_id", input.tenantId)
      .eq("external_id", input.externalId)
      .maybeSingle();
    if (existing) return { reply: null, needsHuman: false };
  }

  await supabase.from("crm_whatsapp_messages").insert({
    tenant_id: input.tenantId,
    conversation_id: input.conversationId,
    direction: "inbound",
    body: input.body,
    sender_type: "human",
    external_id: input.externalId ?? null,
  });

  const { data: conv } = await supabase
    .from("crm_whatsapp_conversations")
    .select("ai_mode")
    .eq("id", input.conversationId)
    .single();

  const aiMode = (conv?.ai_mode as string) ?? "assist";
  const messages = await listMessages(input.tenantId, input.conversationId);
  const auto = maybeAutoReply(messages, aiMode);

  if (auto.reply) {
    await sendWhatsAppMessage({
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      leadId: input.leadId,
      phone: input.phone,
      body: auto.reply,
      senderType: "ai",
    });
  }

  if (auto.needsHuman) {
    await supabase
      .from("crm_whatsapp_conversations")
      .update({ ai_mode: "human" })
      .eq("id", input.conversationId);
  }

  return auto;
}

export async function getWhatsAppConfig(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("crm_whatsapp_tenant_config")
    .select("is_active, phone_number_id, business_account_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return data;
}

export async function validateWhatsAppNumber(tenantId: string, phone: string): Promise<WhatsAppValidationResult> {
  const parsed = parseWhatsAppPhone(phone);
  if (!parsed.valid) {
    return {
      valid: false,
      onWhatsApp: false,
      normalized: null,
      display: parsed.display || null,
      message: parsed.error ?? "Invalid phone number.",
      verified: false,
    };
  }

  const supabase = createAdminClient();
  const { data: config } = await supabase
    .from("crm_whatsapp_tenant_config")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!config?.is_active || !config.phone_number_id || !config.access_token) {
    return {
      valid: true,
      onWhatsApp: true,
      normalized: parsed.normalized,
      display: parsed.display,
      message: "",
      verified: false,
    };
  }

  // Cloud API has no reliable pre-send "is on WhatsApp" check (legacy /contacts is not supported).
  return {
    valid: true,
    onWhatsApp: true,
    normalized: parsed.normalized,
    display: parsed.display,
    message: "",
    verified: false,
  };
}

function mapConversation(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    leadId: row.lead_id as string,
    phone: row.phone as string,
    status: row.status as string,
    aiMode: row.ai_mode as string,
    summary: (row.summary as string) ?? null,
    lastMessageAt: (row.last_message_at as string) ?? null,
  };
}

function mapMessage(row: Record<string, unknown>) {
  const direction = row.direction as "inbound" | "outbound";
  const externalId = (row.external_id as string | null) ?? null;
  return {
    id: row.id as string,
    direction,
    body: row.body as string,
    senderType: row.sender_type as string,
    createdAt: row.created_at as string,
    externalId,
    delivered: direction === "inbound" || !!externalId,
  };
}
