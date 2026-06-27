import { createAdminClient } from "@/lib/supabase/admin";
import type { PaginatedQuery } from "@/types/api";

export type MessageTemplate = {
  id: string;
  tenantId: string;
  name: string;
  channel: string;
  subject: string | null;
  bodyHtml: string | null;
  bodyText: string;
  status: string;
  variables: string[];
  createdAt: string;
};

export type CommunicationSequence = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  triggerEvent: string;
  status: string;
  steps: SequenceStep[];
  createdAt: string;
};

export type SequenceStep = {
  id: string;
  sequenceId: string;
  templateId: string;
  templateName?: string;
  delayMinutes: number;
  sortOrder: number;
};

export type CommunicationLog = {
  id: string;
  leadId: string | null;
  templateId: string | null;
  sequenceId: string | null;
  channel: string;
  recipient: string;
  subject: string | null;
  status: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
};

function mapTemplate(row: Record<string, unknown>): MessageTemplate {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    channel: row.channel as string,
    subject: (row.subject as string) ?? null,
    bodyHtml: (row.body_html as string) ?? null,
    bodyText: String(row.body_text ?? ""),
    status: row.status as string,
    variables: Array.isArray(row.variables) ? (row.variables as string[]) : [],
    createdAt: row.created_at as string,
  };
}

function mapSequence(row: Record<string, unknown>, steps: SequenceStep[] = []): CommunicationSequence {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    triggerEvent: row.trigger_event as string,
    status: row.status as string,
    steps,
    createdAt: row.created_at as string,
  };
}

function mapStep(row: Record<string, unknown>, templateName?: string): SequenceStep {
  return {
    id: row.id as string,
    sequenceId: row.sequence_id as string,
    templateId: row.template_id as string,
    templateName,
    delayMinutes: Number(row.delay_minutes ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapLog(row: Record<string, unknown>): CommunicationLog {
  return {
    id: row.id as string,
    leadId: (row.lead_id as string) ?? null,
    templateId: (row.template_id as string) ?? null,
    sequenceId: (row.sequence_id as string) ?? null,
    channel: row.channel as string,
    recipient: row.recipient as string,
    subject: (row.subject as string) ?? null,
    status: row.status as string,
    errorMessage: (row.error_message as string) ?? null,
    sentAt: (row.sent_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function listTemplates(tenantId: string, channel?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("crm_message_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (channel) query = query.eq("channel", channel);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapTemplate);
}

export async function getTemplate(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_message_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return mapTemplate(data);
}

export async function createTemplate(tenantId: string, userId: string | null, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_message_templates")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      channel: String(input.channel),
      subject: input.subject ?? null,
      body_html: input.bodyHtml ?? input.body_html ?? null,
      body_text: input.bodyText ?? input.body_text ?? "",
      status: input.status ?? "ACTIVE",
      variables: input.variables ?? [],
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapTemplate(data);
}

export async function updateTemplate(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields = [
    ["name", "name"],
    ["channel", "channel"],
    ["subject", "subject"],
    ["bodyHtml", "body_html"],
    ["bodyText", "body_text"],
    ["status", "status"],
    ["variables", "variables"],
  ] as const;
  for (const [inKey, dbKey] of fields) {
    if (input[inKey] !== undefined) payload[dbKey] = input[inKey];
  }
  const { data, error } = await supabase
    .from("crm_message_templates")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapTemplate(data);
}

export async function listSequences(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_communication_sequences")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const sequences = await Promise.all(
    (data ?? []).map(async (row) => {
      const steps = await listSequenceSteps(tenantId, row.id as string);
      return mapSequence(row, steps);
    })
  );
  return sequences;
}

export async function listSequenceSteps(tenantId: string, sequenceId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_sequence_steps")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("sequence_id", sequenceId)
    .order("sort_order");
  if (error) throw error;

  const templates = await listTemplates(tenantId);
  const byId = new Map(templates.map((t) => [t.id, t.name]));
  return (data ?? []).map((row) => mapStep(row, byId.get(row.template_id as string)));
}

export async function createSequence(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_communication_sequences")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      description: input.description ?? null,
      trigger_event: input.triggerEvent ?? "lead.created",
      status: input.status ?? "ACTIVE",
    })
    .select("*")
    .single();
  if (error) throw error;

  const steps = (input.steps as Record<string, unknown>[]) ?? [];
  if (steps.length) {
    await replaceSequenceSteps(tenantId, data.id as string, steps);
  }
  return mapSequence(data, await listSequenceSteps(tenantId, data.id as string));
}

export async function replaceSequenceSteps(tenantId: string, sequenceId: string, steps: Record<string, unknown>[]) {
  const supabase = createAdminClient();
  await supabase.from("crm_sequence_steps").delete().eq("tenant_id", tenantId).eq("sequence_id", sequenceId);

  if (!steps.length) return [];

  const rows = steps.map((s, i) => ({
    tenant_id: tenantId,
    sequence_id: sequenceId,
    template_id: s.templateId,
    delay_minutes: s.delayMinutes ?? 0,
    sort_order: s.sortOrder ?? i,
  }));

  const { data, error } = await supabase.from("crm_sequence_steps").insert(rows).select("*");
  if (error) throw error;
  return (data ?? []).map((row) => mapStep(row));
}

export async function listCommunicationLogs(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const limit = params.limit ?? 50;
  const from = ((params.page ?? 1) - 1) * limit;

  const { data, error, count } = await supabase
    .from("crm_communication_logs")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw error;

  return {
    items: (data ?? []).map(mapLog),
    total: count ?? 0,
    page: params.page ?? 1,
    limit,
  };
}

export async function logCommunication(input: {
  tenantId: string;
  leadId?: string | null;
  templateId?: string | null;
  sequenceId?: string | null;
  channel: string;
  recipient: string;
  subject?: string | null;
  status: string;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_communication_logs")
    .insert({
      tenant_id: input.tenantId,
      lead_id: input.leadId ?? null,
      template_id: input.templateId ?? null,
      sequence_id: input.sequenceId ?? null,
      channel: input.channel,
      recipient: input.recipient,
      subject: input.subject ?? null,
      status: input.status,
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
      sent_at: input.status === "sent" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapLog(data);
}

export async function seedDefaultTemplates(tenantId: string, userId: string | null) {
  const existing = await listTemplates(tenantId);
  if (existing.length) return existing;

  await createTemplate(tenantId, userId, {
    name: "Welcome Email",
    channel: "email",
    subject: "Thanks for reaching out, {{name}}!",
    bodyHtml: "<p>Hi {{name}},</p><p>Thank you for your interest. Our team will contact you shortly.</p>",
    bodyText: "Hi {{name}}, Thank you for your interest. Our team will contact you shortly.",
    variables: ["name", "company", "email"],
    status: "ACTIVE",
  });

  await createTemplate(tenantId, userId, {
    name: "Lead SMS Follow-up",
    channel: "sms",
    bodyText: "Hi {{name}}, thanks for contacting us! We'll be in touch soon.",
    variables: ["name"],
    status: "ACTIVE",
  });

  return listTemplates(tenantId);
}

export async function getSequencesForEvent(tenantId: string, triggerEvent: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_communication_sequences")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("trigger_event", triggerEvent)
    .eq("status", "ACTIVE")
    .is("deleted_at", null);
  if (error) throw error;

  return Promise.all(
    (data ?? []).map(async (row) => mapSequence(row, await listSequenceSteps(tenantId, row.id as string)))
  );
}
