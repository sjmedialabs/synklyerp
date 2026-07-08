import { createAdminClient } from "@/lib/supabase/admin";
import { mapLead } from "@/lib/mappers/modules";
import type { PaginatedQuery } from "@/types/api";
import { PROSPECT_STATUSES, type LeadStageTab } from "@/lib/sales/lead-stages";

const leadSelect = `*, services:service_id ( id, name ), users:assigned_to ( id, name )`;

const SORT_COLUMNS: Record<string, string> = {
  createdAt: "created_at",
  company: "company",
  leadType: "lead_type",
  status: "status",
  assignedTo: "assigned_to",
};

export type ListLeadsParams = PaginatedQuery & {
  leadType?: string;
  stage?: LeadStageTab;
  source?: string;
  assignedTo?: string;
};

export async function listLeads(tenantId: string, params: ListLeadsParams) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const from = (page - 1) * limit;

  const sortCol = SORT_COLUMNS[params.sortBy ?? "createdAt"] ?? "created_at";
  const ascending = params.sortOrder === "asc";

  let query = supabase
    .from("leads")
    .select(leadSelect, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order(sortCol, { ascending });

  if (params.stage && params.stage !== "all") {
    if (params.stage === "fresh") query = query.eq("status", "FRESH_LEAD");
    else if (params.stage === "prospects") query = query.in("status", [...PROSPECT_STATUSES]);
    else if (params.stage === "converted") query = query.eq("status", "CONVERTED");
    else if (params.stage === "dropped") query = query.eq("status", "DROPPED");
  } else if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.leadType) query = query.eq("lead_type", params.leadType);
  if (params.source) query = query.ilike("source", `%${params.source}%`);
  if (params.assignedTo) query = query.eq("assigned_to", params.assignedTo);

  if (params.search) {
    const q = params.search.replace(/[%_]/g, "");
    query = query.or(
      `name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,source.ilike.%${q}%,lead_type.ilike.%${q}%`
    );
  }

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

export async function getLeadDashboardCounts(tenantId: string) {
  const { byStatus } = await getLeadStats(tenantId);
  let fresh = 0;
  let prospects = 0;
  let converted = 0;
  let dropped = 0;

  for (const [status, count] of Object.entries(byStatus)) {
    if (status === "FRESH_LEAD") fresh += count;
    else if ((PROSPECT_STATUSES as readonly string[]).includes(status)) prospects += count;
    else if (status === "CONVERTED") converted += count;
    else if (status === "DROPPED") dropped += count;
  }

  return { all: fresh + prospects + converted + dropped, fresh, prospects, converted, dropped };
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
  if (input.progress !== undefined) payload.progress = input.progress;
  if (input.notes !== undefined) payload.notes = input.notes || null;
  if (input.city !== undefined) payload.city = input.city || null;
  if (input.budget !== undefined) payload.budget = input.budget || null;
  if (input.projectInterest !== undefined) payload.project_interest = input.projectInterest || null;
  if (input.aiSummary !== undefined) payload.ai_summary = input.aiSummary || null;
  if (input.lastCallAt !== undefined) payload.last_call_at = input.lastCallAt || null;
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
