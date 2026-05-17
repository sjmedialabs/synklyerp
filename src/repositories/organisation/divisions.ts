import { createAdminClient } from "@/lib/supabase/admin";
import { mapDivision, divisionToDb, type Division } from "@/lib/mappers/organisation";
import type { PaginatedQuery } from "@/types/api";

export async function listDivisions(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("divisions")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: params.sortOrder === "asc" });

  if (params.status) query = query.eq("status", params.status);
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,code.ilike.%${params.search}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    items: (data ?? []).map(mapDivision),
    total: count ?? 0,
    page,
    limit,
  };
}

export async function createDivision(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("divisions")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      code: String(input.code),
      description: input.description ? String(input.description) : null,
      modules_assigned: (input.modulesAssigned as string[]) ?? [],
      status: String(input.status ?? "ACTIVE"),
    })
    .select()
    .single();
  if (error) throw error;
  return mapDivision(data);
}

export async function updateDivision(
  tenantId: string,
  id: string,
  input: Partial<Omit<Division, "id" | "tenantId" | "createdAt" | "updatedAt">>
) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.code !== undefined) payload.code = input.code;
  if (input.description !== undefined) payload.description = input.description;
  if (input.modulesAssigned !== undefined) payload.modules_assigned = input.modulesAssigned;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await supabase
    .from("divisions")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();
  if (error) throw error;
  return mapDivision(data);
}

export async function deleteDivision(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("divisions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
  return { id };
}
