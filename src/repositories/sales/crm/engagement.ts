import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type EngagementChannel = "call" | "sms" | "email" | "whatsapp";

export async function logLeadEngagement(input: {
  tenantId: string;
  leadId: string;
  userId?: string | null;
  channel: EngagementChannel;
  action?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_lead_engagements")
    .insert({
      tenant_id: input.tenantId,
      lead_id: input.leadId,
      user_id: input.userId ?? null,
      channel: input.channel,
      action: input.action ?? "click",
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error) {
    if (isMissingSchemaError(error)) throw new Error("SCHEMA_NOT_MIGRATED");
    throw error;
  }

  await scheduleFollowupIfNeeded(input.tenantId, input.leadId, input.userId ?? null);

  return mapEngagement(data);
}

async function scheduleFollowupIfNeeded(tenantId: string, leadId: string, userId: string | null) {
  const supabase = createAdminClient();
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 3);

  const { data: lead } = await supabase
    .from("leads")
    .select("status, assigned_to")
    .eq("tenant_id", tenantId)
    .eq("id", leadId)
    .maybeSingle();

  if (!lead || ["CONVERTED", "DROPPED"].includes(lead.status as string)) return;

  const assignee = userId ?? (lead.assigned_to as string | null);
  if (!assignee) return;

  const { data: existing } = await supabase
    .from("crm_followup_reminders")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("lead_id", leadId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return;

  await supabase.from("crm_followup_reminders").insert({
    tenant_id: tenantId,
    lead_id: leadId,
    assigned_to: assignee,
    due_at: dueAt.toISOString(),
    reason: "Follow up after last contact",
  });
}

export async function getLeadEngagementSummary(tenantId: string, leadId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_lead_engagements")
    .select("id, channel, created_at, user_id, action")
    .eq("tenant_id", tenantId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingSchemaError(error)) {
      return { counts: { call: 0, sms: 0, email: 0, whatsapp: 0 }, history: [] };
    }
    throw error;
  }

  const rows = data ?? [];
  const counts: Record<EngagementChannel, number> = { call: 0, sms: 0, email: 0, whatsapp: 0 };
  for (const row of rows) {
    const ch = row.channel as EngagementChannel;
    if (ch in counts) counts[ch] += 1;
  }

  return { counts, history: rows.map(mapEngagement) };
}

export async function listPendingFollowups(tenantId: string, userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_followup_reminders")
    .select("*, leads:lead_id ( id, name, company, status, phone )")
    .eq("tenant_id", tenantId)
    .eq("assigned_to", userId)
    .eq("status", "pending")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(10);
  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    leadId: row.lead_id as string,
    dueAt: row.due_at as string,
    reason: (row.reason as string) ?? null,
    lead: row.leads as { id: string; name: string; company: string | null; status: string; phone: string | null } | null,
  }));
}

function mapEngagement(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    channel: row.channel as EngagementChannel,
    action: row.action as string,
    userId: (row.user_id as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}
