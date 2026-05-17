import { createAdminClient } from "@/lib/supabase/admin";
import { mapOrgTax } from "@/lib/mappers/modules";
import type { PaginatedQuery } from "@/types/api";

export async function listOrgTaxes(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;

  let query = supabase.from("org_taxes").select("*", { count: "exact" }).eq("tenant_id", tenantId).order("name");
  if (params.status) query = query.eq("status", params.status);
  if (params.search) query = query.ilike("name", `%${params.search}%`);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapOrgTax), total: count ?? 0, page, limit };
}

export async function createOrgTax(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("org_taxes")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      rate: Number(input.rate),
      type: String(input.type),
      status: String(input.status ?? "ACTIVE"),
    })
    .select()
    .single();
  if (error) throw error;
  return mapOrgTax(data);
}

export async function updateOrgTax(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.rate !== undefined) payload.rate = input.rate;
  if (input.type !== undefined) payload.type = input.type;
  if (input.status !== undefined) payload.status = input.status;
  const { data, error } = await supabase.from("org_taxes").update(payload).eq("tenant_id", tenantId).eq("id", id).select().single();
  if (error) throw error;
  return mapOrgTax(data);
}

export async function deleteOrgTax(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("org_taxes").delete().eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
  return { id };
}
