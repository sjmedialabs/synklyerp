import { createLead } from "@/repositories/sales/leads";
import { incrementLeadSourceStats } from "@/repositories/sales/crm/lead-sources";
import {
  createLeadAttribution,
  logLeadActivity,
} from "@/repositories/sales/crm/lead-attribution";
import { listWebhooksForEvent, logWebhookDelivery, getWebhook, updateWebhook, listWebhookLogs } from "@/repositories/sales/crm/forms-webhooks";
import { applyLeadRouting } from "@/repositories/sales/crm/routing";
import { applyLeadScore } from "@/repositories/sales/crm/scoring";
import { findDuplicateLead, enqueueDuplicate } from "@/repositories/sales/crm/duplicates";
import { runAutomationRules } from "@/repositories/sales/crm/automation";
import { recordLeadCampaign } from "@/repositories/sales/crm/pipelines";
import { runCommunicationSequences } from "@/lib/crm/communication-service";
import type { Lead } from "@/lib/mappers/modules";

export type IngestLeadInput = {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  leadType?: string;
  source?: string;
  notes?: string;
  serviceId?: string;
  leadSourceId?: string;
  originalSource?: string;
  attribution?: Record<string, unknown>;
  actorId?: string | null;
  ingestChannel?: string;
  skipDuplicateCheck?: boolean;
};

export async function ingestLead(tenantId: string, input: IngestLeadInput): Promise<Lead> {
  const originalSource = input.originalSource ?? input.source ?? "Manual";

  if (!input.skipDuplicateCheck) {
    const dup = await findDuplicateLead(tenantId, {
      email: input.email,
      phone: input.phone,
      company: input.company,
    });
    if (dup) {
      await enqueueDuplicate(tenantId, { ...input, originalSource }, dup.matchedLeadId, dup.matchFields);
    }
  }

  const lead = await createLead(tenantId, {
    name: input.name,
    company: input.company,
    phone: input.phone,
    email: input.email,
    leadType: input.leadType ?? "INBOUND",
    serviceId: input.serviceId,
    source: input.source ?? originalSource,
    status: "FRESH_LEAD",
    notes: input.notes,
    crmLeadSourceId: input.leadSourceId,
    originalSource,
  });

  if (input.attribution && Object.keys(input.attribution).length > 0) {
    await createLeadAttribution(tenantId, lead.id, {
      ...input.attribution,
      capturedFrom: input.attribution.capturedFrom ?? input.ingestChannel ?? originalSource,
    });
    await recordLeadCampaign(tenantId, lead.id, input.attribution);
  }

  const eventCode =
    input.ingestChannel === "embed_form"
      ? "form_submitted"
      : input.ingestChannel === "public_api"
        ? "api_received"
        : "lead_created";

  await logLeadActivity({
    tenantId,
    leadId: lead.id,
    activityType: eventCode,
    title: "Lead created",
    description: `Captured via ${input.ingestChannel ?? originalSource}`,
    actorId: input.actorId ?? null,
    metadata: { source: originalSource, channel: input.ingestChannel },
  });

  await applyLeadScore(tenantId, lead.id, eventCode);
  await applyLeadScore(tenantId, lead.id, "lead_created");

  await applyLeadRouting(tenantId, lead.id, {
    source: originalSource,
    country: input.attribution?.country,
    campaign: input.attribution?.campaign,
  });

  await runAutomationRules(tenantId, "lead.created", lead.id, {
    source: originalSource,
    channel: input.ingestChannel,
    email: input.email,
  });

  await runCommunicationSequences(tenantId, "lead.created", lead.id, input.actorId);

  if (input.leadSourceId) {
    await incrementLeadSourceStats(tenantId, input.leadSourceId, { success: true, leads: 1 });
  }

  await dispatchOutboundWebhooks(tenantId, "lead.created", lead);

  const refreshed = await import("@/repositories/sales/leads").then((m) => m.getLead(tenantId, lead.id));
  return refreshed;
}

async function dispatchOutboundWebhooks(tenantId: string, eventType: string, lead: Lead) {
  const hooks = await listWebhooksForEvent(tenantId, eventType);
  const payload = { event: eventType, lead, timestamp: new Date().toISOString() };

  await Promise.all(
    hooks.map(async (hook) => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": hook.payloadFormat === "form" ? "application/x-www-form-urlencoded" : "application/json",
          ...hook.headers,
        };
        const body =
          hook.payloadFormat === "form"
            ? new URLSearchParams({ payload: JSON.stringify(payload) }).toString()
            : JSON.stringify(payload);

        const res = await fetch(hook.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(15000),
        });
        await logWebhookDelivery({
          tenantId,
          webhookId: hook.id,
          eventType,
          payload,
          responseStatus: res.status,
          responseBody: await res.text().catch(() => ""),
        });
      } catch (err) {
        await logWebhookDelivery({
          tenantId,
          webhookId: hook.id,
          eventType,
          payload,
          errorMessage: err instanceof Error ? err.message : "Webhook delivery failed",
        });
      }
    })
  );
}

export async function testWebhookDelivery(tenantId: string, webhookId: string) {
  const hook = await getWebhook(tenantId, webhookId);
  const payload = { event: "test.ping", timestamp: new Date().toISOString(), tenantId };
  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    await logWebhookDelivery({
      tenantId,
      webhookId,
      eventType: "test.ping",
      payload,
      responseStatus: res.status,
      responseBody: await res.text().catch(() => ""),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    await logWebhookDelivery({
      tenantId,
      webhookId,
      eventType: "test.ping",
      payload,
      errorMessage: err instanceof Error ? err.message : "Test failed",
    });
    throw err;
  }
}

export { dispatchOutboundWebhooks };
