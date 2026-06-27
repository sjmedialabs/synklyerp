import { createAdminClient } from "@/lib/supabase/admin";
import { mapLead } from "@/lib/mappers/modules";
import type { PaginatedQuery } from "@/types/api";

const leadSelect = `*, services:service_id ( id, name ), users:assigned_to ( id, name )`;

export async function listLeads(tenantId: string, params: PaginatedQuery & { leadType?: string }) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;

  let query = supabase.from("leads").select(leadSelect, { count: "exact" }).eq("tenant_id", tenantId).is("deleted_at", null).order("created_at", { ascending: false });
  if (params.status) query = query.eq("status", params.status);
  if (params.leadType) query = query.eq("lead_type", params.leadType);
  if (params.search) query = query.or(`name.ilike.%${params.search}%,company.ilike.%${params.search}%,email.ilike.%${params.search}%`);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapLead), total: count ?? 0, page, limit };
}

export async function getLead(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("leads").select(leadSelect).eq("tenant_id", tenantId).eq("id", id).is("deleted_at", null).single();
  if (error) throw error;
  return mapLead(data);
}

export async function getLeadStats(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("leads").select("status").eq("tenant_id", tenantId).is("deleted_at", null);
  const list = data ?? [];
  const byStatus: Record<string, number> = {};
  for (const row of list) {
    const s = row.status as string;
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }
  return { total: list.length, byStatus };
}

export async function createLead(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("leads").insert({
    tenant_id: tenantId,
    name: String(input.name),
    company: input.company ? String(input.company) : null,
    phone: input.phone ? String(input.phone) : null,
    email: input.email ? String(input.email) : null,
    lead_type: String(input.leadType),
    service_id: input.serviceId || null,
    source: input.source ? String(input.source) : null,
    original_source: input.originalSource ? String(input.originalSource) : input.source ? String(input.source) : null,
    crm_lead_source_id: input.crmLeadSourceId || null,
    assigned_to: input.assignedTo || null,
    status: String(input.status ?? "FRESH_LEAD"),
    notes: input.notes ? String(input.notes) : null,
  }).select(leadSelect).single();
  if (error) throw error;
  return mapLead(data);
}

export async function updateLead(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.company !== undefined) payload.company = input.company || null;
  if (input.phone !== undefined) payload.phone = input.phone || null;
  if (input.email !== undefined) payload.email = input.email || null;
  if (input.leadType !== undefined) payload.lead_type = input.leadType;
  if (input.serviceId !== undefined) payload.service_id = input.serviceId || null;
  if (input.source !== undefined) payload.source = input.source || null;
  if (input.assignedTo !== undefined) payload.assigned_to = input.assignedTo || null;
  // original_source is immutable — never update after creation
  if (input.status !== undefined) payload.status = input.status;
  if (input.notes !== undefined) payload.notes = input.notes || null;
  const { data, error } = await supabase.from("leads").update(payload).eq("tenant_id", tenantId).eq("id", id).is("deleted_at", null).select(leadSelect).single();
  if (error) throw error;
  return mapLead(data);
}

export async function deleteLead(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("leads").update({ deleted_at: new Date().toISOString() }).eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
  return { id };
}
