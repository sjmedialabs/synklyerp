import { createAdminClient } from "@/lib/supabase/admin";
import { mapDesignation, designationToDb, type Designation } from "@/lib/mappers/organisation";
import type { PaginatedQuery } from "@/types/api";

export async function listDesignations(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("designations")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (params.status) query = query.eq("status", params.status);
  if (params.search) query = query.ilike("name", `%${params.search}%`);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    items: (data ?? []).map(mapDesignation),
    total: count ?? 0,
    page,
    limit,
  };
}

export async function createDesignation(tenantId: string, input: { name: string; status: string }) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("designations")
    .insert(designationToDb({ tenantId, ...input }))
    .select()
    .single();
  if (error) throw error;
  return mapDesignation(data);
}

export async function updateDesignation(
  tenantId: string,
  id: string,
  input: Partial<{ name: string; status: string }>
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("designations")
    .update(input)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();
  if (error) throw error;
  return mapDesignation(data);
}

export async function deleteDesignation(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("designations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
  return { id };
}
