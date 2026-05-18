import { createAdminClient } from "@/lib/supabase/admin";
import { mapOrgUser, type OrgUser } from "@/lib/mappers/organisation";
import { hashPassword } from "@/lib/auth/password";
import type { PaginatedQuery } from "@/types/api";

const userSelect = `
  *,
  roles:role_id ( id, name ),
  designations:designation_id ( id, name ),
  branches:branch_id ( id, name )
`;

export async function listOrgUsers(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("users")
    .select(userSelect, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: params.sortOrder === "asc" });

  if (params.status) query = query.eq("status", params.status);
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    items: (data ?? []).map((row) =>
      mapOrgUser({
        ...row,
        roles: Array.isArray(row.roles) ? row.roles[0] : row.roles,
        designations: Array.isArray(row.designations) ? row.designations[0] : row.designations,
        branches: Array.isArray(row.branches) ? row.branches[0] : row.branches,
      })
    ),
    total: count ?? 0,
    page,
    limit,
  };
}

export async function getUserStats(tenantId: string) {
  const supabase = createAdminClient();
  const { count: total } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  const { data: users } = await supabase
    .from("users")
    .select("status, roles:role_id(name)")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  const list = users ?? [];
  const active = list.filter((u) => u.status === "ACTIVE").length;
  const managers = list.filter((u) => {
    const role = Array.isArray(u.roles) ? u.roles[0] : u.roles;
    return (role as { name?: string } | null)?.name === "MANAGER";
  }).length;
  const admins = list.filter((u) => {
    const role = Array.isArray(u.roles) ? u.roles[0] : u.roles;
    return (role as { name?: string } | null)?.name === "ADMIN";
  }).length;

  return { total: total ?? 0, active, managers, admins };
}

export async function createOrgUser(
  tenantId: string,
  input: {
    name: string;
    email: string;
    password: string;
    userCode?: string;
    designationId?: string;
    department?: string;
    branchId?: string;
    roleId?: string;
    status: string;
  }
) {
  const supabase = createAdminClient();
  const passwordHash = await hashPassword(input.password);

  const { data, error } = await supabase
    .from("users")
    .insert({
      tenant_id: tenantId,
      name: input.name,
      email: input.email.toLowerCase(),
      password_hash: passwordHash,
      user_code: input.userCode,
      designation_id: input.designationId ?? null,
      department: input.department,
      branch_id: input.branchId ?? null,
      role_id: input.roleId ?? null,
      status: input.status,
    })
    .select(userSelect)
    .single();

  if (error) throw error;
  return mapOrgUser({
    ...data,
    roles: Array.isArray(data.roles) ? data.roles[0] : data.roles,
    designations: Array.isArray(data.designations) ? data.designations[0] : data.designations,
    branches: Array.isArray(data.branches) ? data.branches[0] : data.branches,
  });
}

export async function updateOrgUser(
  tenantId: string,
  id: string,
  input: Partial<{
    name: string;
    email: string;
    password: string;
    userCode: string;
    designationId: string | null;
    department: string;
    branchId: string | null;
    roleId: string | null;
    status: string;
  }>
) {
  const supabase = createAdminClient();

  if (input.email) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", input.email.toLowerCase())
      .neq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) throw new Error("EMAIL_EXISTS");
  }

  const payload: Record<string, unknown> = {};
  payload.updated_at = new Date().toISOString();
  if (input.name !== undefined) payload.name = input.name;
  if (input.email !== undefined) payload.email = input.email.toLowerCase();
  if (input.password) payload.password_hash = await hashPassword(input.password);
  if (input.userCode !== undefined) payload.user_code = input.userCode;
  if (input.designationId !== undefined) payload.designation_id = input.designationId || null;
  if (input.department !== undefined) payload.department = input.department;
  if (input.branchId !== undefined) payload.branch_id = input.branchId || null;
  if (input.roleId !== undefined) payload.role_id = input.roleId || null;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select(userSelect)
    .single();

  if (error) throw error;
  return mapOrgUser({
    ...data,
    roles: Array.isArray(data.roles) ? data.roles[0] : data.roles,
    designations: Array.isArray(data.designations) ? data.designations[0] : data.designations,
    branches: Array.isArray(data.branches) ? data.branches[0] : data.branches,
  });
}

export async function deleteOrgUser(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
  return { id };
}

export async function listRoles(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, description")
    .or(`tenant_id.eq.${tenantId},is_system.eq.true`);
  if (error) throw error;
  return data ?? [];
}
