import { createAdminClient } from "@/lib/supabase/admin";
import { mapServiceSLA } from "@/lib/mappers/modules";
import type { PaginatedQuery } from "@/types/api";

export async function listServiceSlas(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;
  let query = supabase.from("service_slas").select("*", { count: "exact" }).eq("tenant_id", tenantId).order("created_at", { ascending: false });
  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapServiceSLA), total: count ?? 0, page, limit };
}

export async function createServiceSLA(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("service_slas").insert({
    tenant_id: tenantId,
    service_name: String(input.serviceName),
    response_time: String(input.responseTime),
    resolution_time: String(input.resolutionTime),
    escalation_rules: input.escalationRules ? String(input.escalationRules) : null,
    status: String(input.status ?? "ACTIVE"),
  }).select().single();
  if (error) throw error;
  return mapServiceSLA(data);
}

export async function updateServiceSLA(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.serviceName !== undefined) payload.service_name = input.serviceName;
  if (input.responseTime !== undefined) payload.response_time = input.responseTime;
  if (input.resolutionTime !== undefined) payload.resolution_time = input.resolutionTime;
  if (input.escalationRules !== undefined) payload.escalation_rules = input.escalationRules || null;
  if (input.status !== undefined) payload.status = input.status;
  const { data, error } = await supabase.from("service_slas").update(payload).eq("tenant_id", tenantId).eq("id", id).select().single();
  if (error) throw error;
  return mapServiceSLA(data);
}

export async function deleteServiceSLA(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("service_slas").delete().eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
  return { id };
}
