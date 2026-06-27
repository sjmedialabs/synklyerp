import { createAdminClient } from "@/lib/supabase/admin";

export type ScoreRule = {
  id: string;
  tenantId: string;
  name: string;
  eventCode: string;
  points: number;
  isActive: boolean;
};

function mapScore(row: Record<string, unknown>): ScoreRule {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    eventCode: row.event_code as string,
    points: Number(row.points),
    isActive: Boolean(row.is_active),
  };
}

export async function listScoreRules(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("crm_lead_scores").select("*").eq("tenant_id", tenantId);
  if (error) throw error;
  return (data ?? []).map(mapScore);
}

export async function createScoreRule(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_lead_scores")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      event_code: String(input.eventCode),
      points: Number(input.points),
      is_active: input.isActive ?? true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapScore(data);
}

export async function updateScoreRule(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.eventCode !== undefined) payload.event_code = input.eventCode;
  if (input.points !== undefined) payload.points = input.points;
  if (input.isActive !== undefined) payload.is_active = input.isActive;

  const { data, error } = await supabase
    .from("crm_lead_scores")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapScore(data);
}

export async function applyLeadScore(tenantId: string, leadId: string, eventCode: string) {
  const supabase = createAdminClient();
  const rules = (await listScoreRules(tenantId)).filter((r) => r.isActive && r.eventCode === eventCode);
  if (!rules.length) return 0;

  const delta = rules.reduce((sum, r) => sum + r.points, 0);
  const { data: lead } = await supabase
    .from("leads")
    .select("lead_score")
    .eq("tenant_id", tenantId)
    .eq("id", leadId)
    .single();

  const next = Number(lead?.lead_score ?? 0) + delta;
  await supabase.from("leads").update({ lead_score: next }).eq("tenant_id", tenantId).eq("id", leadId);
  return delta;
}

export async function seedDefaultScoreRules(tenantId: string) {
  const defaults = [
    { name: "Lead created", eventCode: "lead_created", points: 5 },
    { name: "Form submitted", eventCode: "form_submitted", points: 15 },
    { name: "Demo request", eventCode: "demo_request", points: 30 },
    { name: "Pricing page visit", eventCode: "pricing_visit", points: 20 },
  ];
  for (const d of defaults) {
    await createScoreRule(tenantId, d).catch(() => undefined);
  }
}
