import { createAdminClient } from "@/lib/supabase/admin";
import { mapBranch, branchToDb, type Branch } from "@/lib/mappers/organisation";
import type { PaginatedQuery } from "@/types/api";

export async function listBranches(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("branches")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order(params.sortBy === "name" ? "name" : "created_at", {
      ascending: params.sortOrder === "asc",
    });

  if (params.status) query = query.eq("status", params.status);
  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,code.ilike.%${params.search}%,city.ilike.%${params.search}%`
    );
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    items: (data ?? []).map(mapBranch),
    total: count ?? 0,
    page,
    limit,
  };
}

export async function getBranch(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return mapBranch(data);
}

export async function createBranch(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      code: String(input.code),
      description: input.description ? String(input.description) : null,
      office_type: String(input.officeType ?? "None"),
      country: String(input.country),
      state: String(input.state),
      city: String(input.city),
      address: input.address ? String(input.address) : null,
      status: String(input.status ?? "ACTIVE"),
    })
    .select()
    .single();
  if (error) throw error;
  return mapBranch(data);
}

export async function updateBranch(
  tenantId: string,
  id: string,
  input: Partial<Omit<Branch, "id" | "tenantId" | "createdAt" | "updatedAt">>
) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.code !== undefined) payload.code = input.code;
  if (input.description !== undefined) payload.description = input.description;
  if (input.officeType !== undefined) payload.office_type = input.officeType;
  if (input.country !== undefined) payload.country = input.country;
  if (input.state !== undefined) payload.state = input.state;
  if (input.city !== undefined) payload.city = input.city;
  if (input.address !== undefined) payload.address = input.address;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await supabase
    .from("branches")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();
  if (error) throw error;
  return mapBranch(data);
}

export async function deleteBranch(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("branches")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
  return { id };
}
