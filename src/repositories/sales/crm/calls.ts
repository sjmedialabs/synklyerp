import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { mapDograhStatusToLead } from "@/lib/sales/dograh";
import { parseWhatsAppPhone } from "@/lib/sales/whatsapp-phone";
import * as leadsRepo from "@/repositories/sales/leads";
import { logLeadActivity } from "@/repositories/sales/crm/lead-attribution";
import { logLeadEngagement } from "@/repositories/sales/crm/engagement";

export type CallLogRecord = {
  id: string;
  leadId: string;
  externalCallId: string | null;
  status: string | null;
  summary: string | null;
  transcript: string | null;
  recordingUrl: string | null;
  durationSeconds: number | null;
  visitDate: string | null;
  createdAt: string;
};

export async function findLeadByPhone(tenantId: string, phone: string, leadId?: string) {
  if (leadId) {
    try {
      return await leadsRepo.getLead(tenantId, leadId);
    } catch {
      return null;
    }
  }

  const parsed = parseWhatsAppPhone(phone);
  if (!parsed.valid) return null;

  const supabase = createAdminClient();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, phone")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .not("phone", "is", null);

  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }

  const match = (leads ?? []).find((row) => {
    const p = parseWhatsAppPhone(row.phone as string);
    return p.valid && p.normalized === parsed.normalized;
  });

  if (!match) return null;
  return leadsRepo.getLead(tenantId, match.id as string);
}

export async function createCallLog(input: {
  tenantId: string;
  leadId: string;
  externalCallId?: string | null;
  status?: string | null;
  summary?: string | null;
  transcript?: string | null;
  recordingUrl?: string | null;
  durationSeconds?: number | null;
  visitDate?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();

  if (input.externalCallId) {
    const { data: existing } = await supabase
      .from("crm_call_logs")
      .select("id")
      .eq("tenant_id", input.tenantId)
      .eq("external_call_id", input.externalCallId)
      .maybeSingle();
    if (existing) return getCallLog(input.tenantId, existing.id as string);
  }

  const { data, error } = await supabase
    .from("crm_call_logs")
    .insert({
      tenant_id: input.tenantId,
      lead_id: input.leadId,
      external_call_id: input.externalCallId ?? null,
      status: input.status ?? null,
      summary: input.summary ?? null,
      transcript: input.transcript ?? null,
      recording_url: input.recordingUrl ?? null,
      duration_seconds: input.durationSeconds ?? null,
      visit_date: input.visitDate ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingSchemaError(error)) throw new Error("SCHEMA_NOT_MIGRATED");
    throw error;
  }

  return mapCallLog(data);
}

export async function getCallLog(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_call_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();
  if (error) throw error;
  return mapCallLog(data);
}

export async function listCallLogsForLead(tenantId: string, leadId: string, limit = 20) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_call_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data ?? []).map(mapCallLog);
}

export async function getLatestCallLogForLead(tenantId: string, leadId: string) {
  const logs = await listCallLogsForLead(tenantId, leadId, 1);
  return logs[0] ?? null;
}

export async function applyDograhWebhookResult(input: {
  tenantId: string;
  leadId: string;
  phone: string;
  callId?: string | null;
  status?: string | null;
  summary?: string | null;
  transcript?: string | null;
  duration?: number | null;
  recording?: string | null;
  visitDate?: string | null;
}) {
  const callLog = await createCallLog({
    tenantId: input.tenantId,
    leadId: input.leadId,
    externalCallId: input.callId ?? null,
    status: input.status ?? null,
    summary: input.summary ?? null,
    transcript: input.transcript ?? null,
    recordingUrl: input.recording ?? null,
    durationSeconds: input.duration ?? null,
    visitDate: input.visitDate ?? null,
  });

  const mappedStatus = mapDograhStatusToLead(input.status);
  const leadPatch: Record<string, unknown> = {
    ai_summary: input.summary ?? null,
    last_call_at: new Date().toISOString(),
  };
  if (mappedStatus) leadPatch.status = mappedStatus;

  const supabase = createAdminClient();
  const { error: leadError } = await supabase
    .from("leads")
    .update(leadPatch)
    .eq("tenant_id", input.tenantId)
    .eq("id", input.leadId)
    .is("deleted_at", null);
  if (leadError) {
    if (isMissingSchemaError(leadError)) throw new Error("SCHEMA_NOT_MIGRATED");
    throw leadError;
  }

  if (input.visitDate) {
    const dueAt = new Date(input.visitDate);
    if (!Number.isNaN(dueAt.getTime())) {
      const { data: lead } = await supabase
        .from("leads")
        .select("assigned_to")
        .eq("tenant_id", input.tenantId)
        .eq("id", input.leadId)
        .maybeSingle();

      await supabase.from("crm_followup_reminders").insert({
        tenant_id: input.tenantId,
        lead_id: input.leadId,
        assigned_to: (lead?.assigned_to as string | null) ?? null,
        due_at: dueAt.toISOString(),
        reason: input.summary ? `Site visit: ${input.summary}` : "Follow up after AI call",
      });
    }
  }

  await logLeadEngagement({
    tenantId: input.tenantId,
    leadId: input.leadId,
    channel: "call",
    action: "ai_call_completed",
    metadata: { callLogId: callLog.id, duration: input.duration ?? null },
  });

  await logLeadActivity({
    tenantId: input.tenantId,
    leadId: input.leadId,
    activityType: "ai_call",
    title: "AI call completed",
    description: input.summary ?? undefined,
    metadata: {
      callLogId: callLog.id,
      status: input.status ?? null,
      duration: input.duration ?? null,
    },
  });

  return callLog;
}

function mapCallLog(row: Record<string, unknown>): CallLogRecord {
  return {
    id: row.id as string,
    leadId: row.lead_id as string,
    externalCallId: (row.external_call_id as string) ?? null,
    status: (row.status as string) ?? null,
    summary: (row.summary as string) ?? null,
    transcript: (row.transcript as string) ?? null,
    recordingUrl: (row.recording_url as string) ?? null,
    durationSeconds: row.duration_seconds != null ? Number(row.duration_seconds) : null,
    visitDate: (row.visit_date as string) ?? null,
    createdAt: row.created_at as string,
  };
}
