import { createAdminClient } from "@/lib/supabase/admin";
import { mapCrmForm, mapCrmWebhook } from "@/lib/mappers/crm";
import type { PaginatedQuery } from "@/types/api";

export async function listForms(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("crm_forms")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapCrmForm), total: count ?? 0, page, limit };
}

export async function createForm(tenantId: string, userId: string | null, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_forms")
    .insert({
      tenant_id: tenantId,
      lead_source_id: input.leadSourceId || null,
      name: String(input.name),
      description: input.description ? String(input.description) : null,
      status: String(input.status ?? "DRAFT"),
      category: input.category ? String(input.category) : null,
      success_message: input.successMessage ? String(input.successMessage) : null,
      redirect_url: input.redirectUrl ? String(input.redirectUrl) : null,
      spam_protection: String(input.spamProtection ?? "none"),
      notification_email: input.notificationEmail ? String(input.notificationEmail) : null,
      campaign: input.campaign ? String(input.campaign) : null,
      lead_source_label: input.leadSourceLabel ? String(input.leadSourceLabel) : null,
      tags: input.tags ?? [],
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCrmForm(data);
}

export async function listWebhooks(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("crm_webhooks")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapCrmWebhook), total: count ?? 0, page, limit };
}

export async function createWebhook(tenantId: string, userId: string | null, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_webhooks")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      url: String(input.url),
      events: input.events ?? [],
      headers: input.headers ?? {},
      auth_type: String(input.authType ?? "none"),
      auth_config: input.authConfig ?? {},
      payload_format: String(input.payloadFormat ?? "json"),
      retry_policy: String(input.retryPolicy ?? "immediate"),
      timeout_ms: input.timeoutMs ?? 30000,
      status: String(input.status ?? "ACTIVE"),
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCrmForm(data);
}

export async function getWebhook(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_webhooks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return mapCrmWebhook(data);
}

export async function updateWebhook(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name;
  if (input.url !== undefined) payload.url = input.url;
  if (input.events !== undefined) payload.events = input.events;
  if (input.status !== undefined) payload.status = input.status;
  if (input.retryPolicy !== undefined) payload.retry_policy = input.retryPolicy;

  const { data, error } = await supabase
    .from("crm_webhooks")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapCrmWebhook(data);
}

export async function updateWebhookLastTest(_tenantId: string, _id: string) {
  /* reserved for future last_tested_at column */
}

export async function listWebhookLogs(tenantId: string, webhookId?: string, limit = 50) {
  const supabase = createAdminClient();
  let query = supabase
    .from("crm_webhook_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (webhookId) query = query.eq("webhook_id", webhookId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    webhookId: row.webhook_id as string,
    eventType: row.event_type as string,
    responseStatus: row.response_status != null ? Number(row.response_status) : null,
    errorMessage: (row.error_message as string) ?? null,
    attempt: Number(row.attempt ?? 1),
    deliveredAt: (row.delivered_at as string) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function listWebhooksForEvent(tenantId: string, eventType: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_webhooks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .contains("events", [eventType]);
  if (error) throw error;
  return (data ?? []).map(mapCrmWebhook);
}

export async function logWebhookDelivery(input: {
  tenantId: string;
  webhookId: string;
  eventType: string;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  attempt?: number;
}) {
  const supabase = createAdminClient();
  await supabase.from("crm_webhook_logs").insert({
    tenant_id: input.tenantId,
    webhook_id: input.webhookId,
    event_type: input.eventType,
    payload: input.payload,
    response_status: input.responseStatus ?? null,
    response_body: input.responseBody ?? null,
    error_message: input.errorMessage ?? null,
    attempt: input.attempt ?? 1,
    delivered_at: input.responseStatus && input.responseStatus < 400 ? new Date().toISOString() : null,
  });
}
