import { createAdminClient } from "@/lib/supabase/admin";
import { mapCrmLeadAttribution, mapCrmLeadActivity } from "@/lib/mappers/crm";

export async function createLeadAttribution(
  tenantId: string,
  leadId: string,
  input: Record<string, unknown>
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_lead_attribution")
    .insert({
      tenant_id: tenantId,
      lead_id: leadId,
      captured_from: input.capturedFrom ?? input.captured_from ?? null,
      campaign: input.campaign ?? null,
      ad_group: input.adGroup ?? input.ad_group ?? null,
      keyword: input.keyword ?? null,
      utm_source: input.utmSource ?? input.utm_source ?? null,
      utm_medium: input.utmMedium ?? input.utm_medium ?? null,
      utm_campaign: input.utmCampaign ?? input.utm_campaign ?? null,
      utm_content: input.utmContent ?? input.utm_content ?? null,
      utm_term: input.utmTerm ?? input.utm_term ?? null,
      landing_page: input.landingPage ?? input.landing_page ?? null,
      referrer_url: input.referrerUrl ?? input.referrer_url ?? null,
      ip_address: input.ipAddress ?? input.ip_address ?? null,
      device: input.device ?? null,
      browser: input.browser ?? null,
      country: input.country ?? null,
      city: input.city ?? null,
      timezone: input.timezone ?? null,
      language: input.language ?? null,
      channel: input.channel ?? null,
      creative: input.creative ?? null,
      cost: input.cost ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCrmLeadAttribution(data);
}

export async function getLeadAttribution(tenantId: string, leadId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_lead_attribution")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("lead_id", leadId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCrmLeadAttribution(data) : null;
}

export async function logLeadActivity(input: {
  tenantId: string;
  leadId: string;
  activityType: string;
  title: string;
  description?: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_lead_activities")
    .insert({
      tenant_id: input.tenantId,
      lead_id: input.leadId,
      activity_type: input.activityType,
      title: input.title,
      description: input.description ?? null,
      actor_id: input.actorId ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCrmLeadActivity(data);
}

export async function listLeadActivities(tenantId: string, leadId: string, limit = 100) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_lead_activities")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapCrmLeadActivity);
}
