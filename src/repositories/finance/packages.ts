import { createAdminClient } from "@/lib/supabase/admin";
import { mapServicePackage } from "@/lib/mappers/modules";
import type { PaginatedQuery } from "@/types/api";

export async function listServicePackages(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;
  let query = supabase.from("service_packages").select("*", { count: "exact" }).eq("tenant_id", tenantId).order("created_at", { ascending: false });
  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapServicePackage), total: count ?? 0, page, limit };
}

export async function createServicePackage(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("service_packages").insert({
    tenant_id: tenantId,
    name: String(input.name),
    included_services: input.includedServices ?? [],
    discount: Number(input.discount ?? 0),
    validity_days: input.validityDays ?? null,
    status: String(input.status ?? "ACTIVE"),
  }).select().single();
  if (error) throw error;
  return mapServicePackage(data);
}

export async function updateServicePackage(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.includedServices !== undefined) payload.included_services = input.includedServices;
  if (input.discount !== undefined) payload.discount = input.discount;
  if (input.validityDays !== undefined) payload.validity_days = input.validityDays;
  if (input.status !== undefined) payload.status = input.status;
  const { data, error } = await supabase.from("service_packages").update(payload).eq("tenant_id", tenantId).eq("id", id).select().single();
  if (error) throw error;
  return mapServicePackage(data);
}

export async function deleteServicePackage(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("service_packages").delete().eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
  return { id };
}
