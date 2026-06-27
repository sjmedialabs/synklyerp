import { getTemplate } from "@/repositories/sales/crm/communication";
import { logCommunication } from "@/repositories/sales/crm/communication";
import { logLeadActivity } from "@/repositories/sales/crm/lead-attribution";
import { getLead } from "@/repositories/sales/leads";

export function renderTemplateText(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

function leadVars(lead: { name: string; email?: string | null; company?: string | null; phone?: string | null }) {
  return {
    name: lead.name,
    email: lead.email ?? "",
    company: lead.company ?? "",
    phone: lead.phone ?? "",
  };
}

async function deliverEmail(to: string, subject: string, html: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "SynklyERP <noreply@synklyerp.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not configured");
    return { delivered: false, provider: "none" as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });

  if (!res.ok) throw new Error(`Email delivery failed: ${await res.text()}`);
  return { delivered: true, provider: "resend" as const };
}

async function deliverSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    if (process.env.NODE_ENV === "production") throw new Error("Twilio SMS is not configured");
    return { delivered: false, provider: "none" as const };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });

  if (!res.ok) throw new Error(`SMS delivery failed: ${await res.text()}`);
  return { delivered: true, provider: "twilio" as const };
}

export async function sendTemplateToLead(
  tenantId: string,
  leadId: string,
  templateId: string,
  opts?: { sequenceId?: string; actorId?: string | null }
) {
  const [lead, template] = await Promise.all([getLead(tenantId, leadId), getTemplate(tenantId, templateId)]);
  const vars = leadVars(lead);

  if (template.channel === "email") {
    if (!lead.email) {
      await logCommunication({
        tenantId,
        leadId,
        templateId,
        sequenceId: opts?.sequenceId,
        channel: "email",
        recipient: "",
        subject: template.subject,
        status: "skipped",
        errorMessage: "Lead has no email address",
      });
      return { status: "skipped" as const, reason: "no_email" };
    }

    const subject = renderTemplateText(template.subject ?? "Message from SynklyERP", vars);
    const html = renderTemplateText(template.bodyHtml ?? template.bodyText, vars);
    const text = renderTemplateText(template.bodyText, vars);

    try {
      const result = await deliverEmail(lead.email, subject, html, text);
      await logCommunication({
        tenantId,
        leadId,
        templateId,
        sequenceId: opts?.sequenceId,
        channel: "email",
        recipient: lead.email,
        subject,
        status: result.delivered ? "sent" : "queued",
        metadata: { provider: result.provider },
      });
      await logLeadActivity({
        tenantId,
        leadId,
        activityType: "email_sent",
        title: `Email sent: ${template.name}`,
        description: subject,
        actorId: opts?.actorId,
        metadata: { templateId },
      });
      return { status: "sent" as const };
    } catch (err) {
      await logCommunication({
        tenantId,
        leadId,
        templateId,
        sequenceId: opts?.sequenceId,
        channel: "email",
        recipient: lead.email,
        subject,
        status: "failed",
        errorMessage: (err as Error).message,
      });
      throw err;
    }
  }

  if (template.channel === "sms" || template.channel === "whatsapp") {
    if (!lead.phone) {
      await logCommunication({
        tenantId,
        leadId,
        templateId,
        sequenceId: opts?.sequenceId,
        channel: template.channel,
        recipient: "",
        status: "skipped",
        errorMessage: "Lead has no phone number",
      });
      return { status: "skipped" as const, reason: "no_phone" };
    }

    const body = renderTemplateText(template.bodyText, vars);
    try {
      const result = await deliverSms(lead.phone, body);
      await logCommunication({
        tenantId,
        leadId,
        templateId,
        sequenceId: opts?.sequenceId,
        channel: template.channel,
        recipient: lead.phone,
        status: result.delivered ? "sent" : "queued",
        metadata: { provider: result.provider },
      });
      await logLeadActivity({
        tenantId,
        leadId,
        activityType: "sms_sent",
        title: `SMS sent: ${template.name}`,
        description: body.slice(0, 120),
        actorId: opts?.actorId,
        metadata: { templateId },
      });
      return { status: "sent" as const };
    } catch (err) {
      await logCommunication({
        tenantId,
        leadId,
        templateId,
        sequenceId: opts?.sequenceId,
        channel: template.channel,
        recipient: lead.phone,
        status: "failed",
        errorMessage: (err as Error).message,
      });
      throw err;
    }
  }

  return { status: "skipped" as const, reason: "unsupported_channel" };
}

export async function runCommunicationSequences(
  tenantId: string,
  triggerEvent: string,
  leadId: string,
  actorId?: string | null
) {
  const { getSequencesForEvent } = await import("@/repositories/sales/crm/communication");
  const sequences = await getSequencesForEvent(tenantId, triggerEvent);

  for (const seq of sequences) {
    for (const step of seq.steps) {
      if (step.delayMinutes === 0) {
        await sendTemplateToLead(tenantId, leadId, step.templateId, { sequenceId: seq.id, actorId });
      } else {
        await logCommunication({
          tenantId,
          leadId,
          templateId: step.templateId,
          sequenceId: seq.id,
          channel: "sequence",
          recipient: leadId,
          status: "queued",
          metadata: { delayMinutes: step.delayMinutes, scheduled: true },
        });
      }
    }
  }
}
