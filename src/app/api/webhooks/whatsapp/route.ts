import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseWhatsAppPhone } from "@/lib/sales/whatsapp-phone";
import { getOrCreateConversation, processInboundMessage } from "@/repositories/sales/crm/whatsapp";

/** Meta WhatsApp webhook verification */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: config } = await supabase
    .from("crm_whatsapp_tenant_config")
    .select("tenant_id")
    .eq("webhook_verify_token", token)
    .maybeSingle();

  if (!config) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return new NextResponse(challenge, { status: 200 });
}

/** Inbound WhatsApp messages from Meta */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const phoneNumberId = value?.metadata?.phone_number_id as string | undefined;

    if (!phoneNumberId) return NextResponse.json({ ok: true });

    const supabase = createAdminClient();
    const { data: config } = await supabase
      .from("crm_whatsapp_tenant_config")
      .select("tenant_id")
      .eq("phone_number_id", phoneNumberId)
      .eq("is_active", true)
      .maybeSingle();

    if (!config) return NextResponse.json({ ok: true });

    const tenantId = config.tenant_id as string;
    const messages = value?.messages ?? [];

    for (const msg of messages) {
      const from = msg.from as string;
      const text = msg.text?.body as string | undefined;
      const externalId = msg.id as string | undefined;
      if (!from || !text) continue;

      const { data: leads } = await supabase
        .from("leads")
        .select("id, phone")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .not("phone", "is", null);

      const lead = (leads ?? []).find((row) => {
        const parsed = parseWhatsAppPhone(row.phone as string);
        return parsed.valid && parsed.normalized === from;
      });

      if (!lead) continue;

      const conversation = await getOrCreateConversation(tenantId, lead.id as string, from);
      await processInboundMessage({
        tenantId,
        conversationId: conversation.id,
        leadId: lead.id as string,
        phone: from,
        body: text,
        externalId: externalId ?? null,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
