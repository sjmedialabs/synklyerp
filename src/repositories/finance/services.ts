import { createAdminClient } from "@/lib/supabase/admin";
import { mapService } from "@/lib/mappers/modules";
import type { PaginatedQuery } from "@/types/api";

export async function getServiceStats(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("services")
    .select("status")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);
  const list = data ?? [];
  return {
    total: list.length,
    active: list.filter((r) => (r.status as string) === "ACTIVE").length,
  };
}

export async function listServices(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;

  let query = supabase.from("services").select("*", { count: "exact" }).eq("tenant_id", tenantId).is("deleted_at", null).order("created_at", { ascending: false });
  if (params.status) query = query.eq("status", params.status);
  if (params.search) query = query.or(`name.ilike.%${params.search}%,category.ilike.%${params.search}%`);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapService), total: count ?? 0, page, limit };
}

export async function createService(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      category: String(input.category),
      description: input.description ? String(input.description) : null,
      base_price: Number(input.basePrice),
      unit: String(input.unit),
      status: String(input.status ?? "ACTIVE"),
    })
    .select()
    .single();
  if (error) throw error;
  return mapService(data);
}

export async function updateService(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.category !== undefined) payload.category = input.category;
  if (input.description !== undefined) payload.description = input.description || null;
  if (input.basePrice !== undefined) payload.base_price = input.basePrice;
  if (input.unit !== undefined) payload.unit = input.unit;
  if (input.status !== undefined) payload.status = input.status;
  const { data, error } = await supabase.from("services").update(payload).eq("tenant_id", tenantId).eq("id", id).is("deleted_at", null).select().single();
  if (error) throw error;
  return mapService(data);
}

export async function deleteService(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("services").update({ deleted_at: new Date().toISOString() }).eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
  return { id };
}
