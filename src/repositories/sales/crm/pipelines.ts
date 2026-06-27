import { createAdminClient } from "@/lib/supabase/admin";

export type Pipeline = {
  id: string;
  tenantId: string;
  name: string;
  industry: string | null;
  isDefault: boolean;
  status: string;
};

export type PipelineStage = {
  id: string;
  pipelineId: string;
  name: string;
  probability: number;
  color: string;
  expectedDays: number | null;
  sortOrder: number;
};

function mapPipeline(row: Record<string, unknown>): Pipeline {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    industry: (row.industry as string) ?? null,
    isDefault: Boolean(row.is_default),
    status: row.status as string,
  };
}

function mapStage(row: Record<string, unknown>): PipelineStage {
  return {
    id: row.id as string,
    pipelineId: row.pipeline_id as string,
    name: row.name as string,
    probability: Number(row.probability ?? 0),
    color: row.color as string,
    expectedDays: row.expected_days != null ? Number(row.expected_days) : null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function listPipelines(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_pipelines")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map(mapPipeline);
}

export async function createPipeline(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_pipelines")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      industry: input.industry ? String(input.industry) : null,
      is_default: input.isDefault ?? false,
      status: "ACTIVE",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapPipeline(data);
}

export async function listPipelineStages(tenantId: string, pipelineId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("pipeline_id", pipelineId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(mapStage);
}

export async function replacePipelineStages(
  tenantId: string,
  pipelineId: string,
  stages: Record<string, unknown>[]
) {
  const supabase = createAdminClient();
  await supabase.from("crm_pipeline_stages").delete().eq("tenant_id", tenantId).eq("pipeline_id", pipelineId);

  if (!stages.length) return [];

  const rows = stages.map((s, i) => ({
    tenant_id: tenantId,
    pipeline_id: pipelineId,
    name: String(s.name),
    probability: s.probability ?? 0,
    color: s.color ?? "#6366f1",
    expected_days: s.expectedDays ?? null,
    sort_order: s.sortOrder ?? i,
  }));

  const { data, error } = await supabase.from("crm_pipeline_stages").insert(rows).select("*");
  if (error) throw error;
  return (data ?? []).map(mapStage);
}

export async function seedDefaultPipeline(tenantId: string) {
  const existing = await listPipelines(tenantId);
  if (existing.length) return existing[0];

  const pipeline = await createPipeline(tenantId, { name: "Default Sales Pipeline", isDefault: true });
  await replacePipelineStages(tenantId, pipeline.id, [
    { name: "Fresh Lead", probability: 10, color: "#94a3b8", sortOrder: 0 },
    { name: "Qualified", probability: 30, color: "#6366f1", sortOrder: 1 },
    { name: "Proposal", probability: 60, color: "#8b5cf6", sortOrder: 2 },
    { name: "Negotiation", probability: 80, color: "#f59e0b", sortOrder: 3 },
    { name: "Won", probability: 100, color: "#10b981", sortOrder: 4 },
    { name: "Lost", probability: 0, color: "#ef4444", sortOrder: 5 },
  ]);
  return pipeline;
}

export async function recordLeadCampaign(
  tenantId: string,
  leadId: string,
  input: Record<string, unknown>
) {
  const supabase = createAdminClient();
  if (!input.campaign && !input.channel && !input.adGroup) return null;

  const { data, error } = await supabase
    .from("crm_lead_campaigns")
    .insert({
      tenant_id: tenantId,
      lead_id: leadId,
      campaign: input.campaign ?? null,
      ad_group: input.adGroup ?? null,
      keyword: input.keyword ?? null,
      channel: input.channel ?? input.utmMedium ?? null,
      cost: input.cost ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getCrmReportSummary(tenantId: string) {
  const supabase = createAdminClient();

  const [{ count: totalLeads }, { data: sources }, { data: logs }, { data: forms }] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).is("deleted_at", null),
    supabase.from("crm_lead_sources").select("name, total_leads, health_status").eq("tenant_id", tenantId).is("deleted_at", null),
    supabase.from("crm_api_logs").select("status_code").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(500),
    supabase.from("crm_forms").select("name, view_count, submission_count, spam_count").eq("tenant_id", tenantId).is("deleted_at", null),
  ]);

  const apiErrors = (logs ?? []).filter((l) => Number(l.status_code) >= 400).length;
  const formViews = (forms ?? []).reduce((s, f) => s + Number(f.view_count ?? 0), 0);
  const formSubs = (forms ?? []).reduce((s, f) => s + Number(f.submission_count ?? 0), 0);

  return {
    totalLeads: totalLeads ?? 0,
    leadSources: sources ?? [],
    apiRequests: logs?.length ?? 0,
    apiErrors,
    formViews,
    formSubmissions: formSubs,
    conversionRate: formViews > 0 ? Math.round((formSubs / formViews) * 100) : 0,
    forms: forms ?? [],
  };
}
