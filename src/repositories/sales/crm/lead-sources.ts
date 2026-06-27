import { createAdminClient } from "@/lib/supabase/admin";
import { mapCrmLeadSource } from "@/lib/mappers/crm";
import type { PaginatedQuery } from "@/types/api";

export async function listLeadSources(tenantId: string, params: PaginatedQuery & { status?: string }) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;

  let query = supabase
    .from("crm_lead_sources")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.search) query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapCrmLeadSource), total: count ?? 0, page, limit };
}

export async function getLeadSource(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_lead_sources")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return mapCrmLeadSource(data);
}

export async function createLeadSource(tenantId: string, userId: string | null, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_lead_sources")
    .insert({
      tenant_id: tenantId,
      source_type_code: String(input.sourceTypeCode),
      name: String(input.name),
      description: input.description ? String(input.description) : null,
      status: String(input.status ?? "ACTIVE"),
      auth_type: String(input.authType ?? "api_key"),
      webhook_url: input.webhookUrl ? String(input.webhookUrl) : null,
      rate_limit_per_minute: input.rateLimitPerMinute ?? 60,
      config: input.config ?? {},
      headers: input.headers ?? {},
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCrmLeadSource(data);
}

export async function updateLeadSource(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description || null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.authType !== undefined) payload.auth_type = input.authType;
  if (input.webhookUrl !== undefined) payload.webhook_url = input.webhookUrl || null;
  if (input.rateLimitPerMinute !== undefined) payload.rate_limit_per_minute = input.rateLimitPerMinute;
  if (input.config !== undefined) payload.config = input.config;
  if (input.headers !== undefined) payload.headers = input.headers;

  const { data, error } = await supabase
    .from("crm_lead_sources")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();
  if (error) throw error;
  return mapCrmLeadSource(data);
}

export async function incrementLeadSourceStats(
  tenantId: string,
  id: string,
  opts: { success: boolean; leads?: number }
) {
  const supabase = createAdminClient();
  const source = await getLeadSource(tenantId, id);
  const { error } = await supabase
    .from("crm_lead_sources")
    .update({
      total_leads: source.totalLeads + (opts.leads ?? (opts.success ? 1 : 0)),
      successful_requests: source.successfulRequests + (opts.success ? 1 : 0),
      failed_requests: source.failedRequests + (opts.success ? 0 : 1),
      last_sync_at: new Date().toISOString(),
      health_status: opts.success ? "healthy" : "degraded",
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}

export async function listSourceTypes() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("crm_source_types").select("*").eq("is_active", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
}
