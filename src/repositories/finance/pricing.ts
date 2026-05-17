import { createAdminClient } from "@/lib/supabase/admin";
import { mapPricingRule } from "@/lib/mappers/modules";
import type { PaginatedQuery } from "@/types/api";

export async function listPricingRules(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;
  let query = supabase.from("pricing_rules").select("*", { count: "exact" }).eq("tenant_id", tenantId).order("created_at", { ascending: false });
  if (params.search) query = query.ilike("name", `%${params.search}%`);
  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapPricingRule), total: count ?? 0, page, limit };
}

export async function createPricingRule(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("pricing_rules").insert({
    tenant_id: tenantId,
    name: String(input.name),
    segment: input.segment ? String(input.segment) : null,
    condition_text: input.condition ? String(input.condition) : null,
    adjustment: Number(input.adjustment),
    status: String(input.status ?? "ACTIVE"),
  }).select().single();
  if (error) throw error;
  return mapPricingRule(data);
}

export async function updatePricingRule(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.segment !== undefined) payload.segment = input.segment || null;
  if (input.condition !== undefined) payload.condition_text = input.condition || null;
  if (input.adjustment !== undefined) payload.adjustment = input.adjustment;
  if (input.status !== undefined) payload.status = input.status;
  const { data, error } = await supabase.from("pricing_rules").update(payload).eq("tenant_id", tenantId).eq("id", id).select().single();
  if (error) throw error;
  return mapPricingRule(data);
}

export async function deletePricingRule(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("pricing_rules").delete().eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
  return { id };
}
