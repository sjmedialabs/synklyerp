import { createAdminClient } from "@/lib/supabase/admin";
import type { PaginatedQuery } from "@/types/api";

export type CrmCampaign = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  channel: string | null;
  status: string;
  budget: number | null;
  spend: number;
  utmCampaign: string | null;
  startAt: string | null;
  endAt: string | null;
  leadCount: number;
  totalCost: number;
  createdAt: string;
};

function mapCampaign(row: Record<string, unknown>, stats?: { leadCount: number; totalCost: number }): CrmCampaign {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    code: row.code as string,
    channel: (row.channel as string) ?? null,
    status: row.status as string,
    budget: row.budget != null ? Number(row.budget) : null,
    spend: Number(row.spend ?? 0),
    utmCampaign: (row.utm_campaign as string) ?? null,
    startAt: (row.start_at as string) ?? null,
    endAt: (row.end_at as string) ?? null,
    leadCount: stats?.leadCount ?? 0,
    totalCost: stats?.totalCost ?? 0,
    createdAt: row.created_at as string,
  };
}

async function campaignStats(tenantId: string, campaignId: string) {
  const supabase = createAdminClient();
  const { count: byId } = await supabase
    .from("crm_lead_campaigns")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("campaign_id", campaignId);

  const { data: costs } = await supabase
    .from("crm_lead_campaigns")
    .select("cost")
    .eq("tenant_id", tenantId)
    .eq("campaign_id", campaignId);

  const rows = costs ?? [];
  return {
    leadCount: byId ?? rows.length,
    totalCost: rows.reduce((s, r) => s + Number(r.cost ?? 0), 0),
  };
}

export async function listCampaigns(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_campaigns")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const campaigns = await Promise.all(
    (data ?? []).map(async (row) => {
      const stats = await campaignStats(tenantId, row.id as string);
      return mapCampaign(row, stats);
    })
  );
  return campaigns;
}

export async function createCampaign(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const code = String(input.code ?? input.name).toLowerCase().replace(/\s+/g, "_").slice(0, 64);
  const { data, error } = await supabase
    .from("crm_campaigns")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      code,
      channel: input.channel ? String(input.channel) : null,
      status: input.status ?? "ACTIVE",
      budget: input.budget ?? null,
      utm_campaign: input.utmCampaign ?? input.utm_campaign ?? null,
      start_at: input.startAt ?? input.start_at ?? null,
      end_at: input.endAt ?? input.end_at ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCampaign(data, { leadCount: 0, totalCost: 0 });
}

export async function updateCampaign(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields = [
    ["name", "name"],
    ["channel", "channel"],
    ["status", "status"],
    ["budget", "budget"],
    ["spend", "spend"],
    ["utmCampaign", "utm_campaign"],
    ["startAt", "start_at"],
    ["endAt", "end_at"],
  ] as const;
  for (const [inKey, dbKey] of fields) {
    if (input[inKey] !== undefined) payload[dbKey] = input[inKey];
  }
  const { data, error } = await supabase
    .from("crm_campaigns")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  const stats = await campaignStats(tenantId, id);
  return mapCampaign(data, stats);
}

export async function listLeadCampaignAttributions(tenantId: string, params: PaginatedQuery & { campaignId?: string }) {
  const supabase = createAdminClient();
  const limit = params.limit ?? 50;
  const from = ((params.page ?? 1) - 1) * limit;

  let query = supabase
    .from("crm_lead_campaigns")
    .select("*, leads(name, email, company)", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (params.campaignId) query = query.eq("campaign_id", params.campaignId);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;

  return {
    items: (data ?? []).map((row) => ({
      id: row.id as string,
      leadId: row.lead_id as string,
      campaign: (row.campaign as string) ?? null,
      adGroup: (row.ad_group as string) ?? null,
      keyword: (row.keyword as string) ?? null,
      channel: (row.channel as string) ?? null,
      cost: row.cost != null ? Number(row.cost) : null,
      roi: row.roi != null ? Number(row.roi) : null,
      createdAt: row.created_at as string,
      lead: row.leads as { name: string; email: string | null; company: string | null } | null,
    })),
    total: count ?? 0,
    page: params.page ?? 1,
    limit,
  };
}
