import { createAdminClient } from "@/lib/supabase/admin";
import { mapDesignation, designationToDb } from "@/lib/mappers/organisation";
import type { PaginatedQuery } from "@/types/api";

export type ListDesignationsParams = PaginatedQuery & {
  department?: string;
  gradeLevel?: string;
};

async function employeeCountsByDesignation(tenantId: string) {
  const supabase = createAdminClient();
  const counts = new Map<string, number>();

  const { data: employees } = await supabase
    .from("employees")
    .select("designation_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  for (const row of employees ?? []) {
    const id = row.designation_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const { data: users } = await supabase
    .from("users")
    .select("designation_id")
    .eq("tenant_id", tenantId)
    .not("designation_id", "is", null);

  for (const row of users ?? []) {
    const id = row.designation_id as string;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}

export async function getDesignationStats(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("designations")
    .select("status, department")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);
  if (error) throw error;

  const rows = data ?? [];
  let active = 0;
  let inactive = 0;
  const departments = new Set<string>();

  for (const row of rows) {
    if (row.status === "ACTIVE") active++;
    else inactive++;
    const dept = row.department as string | null;
    if (dept?.trim()) departments.add(dept.trim());
  }

  return {
    total: rows.length,
    active,
    inactive,
    departmentsMapped: departments.size,
  };
}

export async function listDesignationFilterOptions(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("designations")
    .select("department, grade_level")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);
  if (error) throw error;

  const departments = new Set<string>();
  const grades = new Set<string>();
  for (const row of data ?? []) {
    const d = row.department as string | null;
    const g = row.grade_level as string | null;
    if (d?.trim()) departments.add(d.trim());
    if (g?.trim()) grades.add(g.trim());
  }

  return {
    departments: [...departments].sort(),
    gradeLevels: [...grades].sort(),
  };
}

export async function listDesignations(tenantId: string, params: ListDesignationsParams) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("designations")
    .select("*, reports_to:reports_to_designation_id ( id, name )", { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (params.status) query = query.eq("status", params.status);
  if (params.search) query = query.ilike("name", `%${params.search}%`);
  if (params.department) query = query.eq("department", params.department);
  if (params.gradeLevel) query = query.eq("grade_level", params.gradeLevel);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const empCounts = await employeeCountsByDesignation(tenantId);

  return {
    items: (data ?? []).map((row) =>
      mapDesignation({
        ...row,
        employee_count: empCounts.get(row.id as string) ?? 0,
      })
    ),
    total: count ?? 0,
    page,
    limit,
  };
}

export async function listAllDesignationsForExport(tenantId: string, params: ListDesignationsParams) {
  const supabase = createAdminClient();
  let query = supabase
    .from("designations")
    .select("*, reports_to:reports_to_designation_id ( id, name )")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (params.status) query = query.eq("status", params.status);
  if (params.search) query = query.ilike("name", `%${params.search}%`);
  if (params.department) query = query.eq("department", params.department);
  if (params.gradeLevel) query = query.eq("grade_level", params.gradeLevel);

  const { data, error } = await query;
  if (error) throw error;

  const empCounts = await employeeCountsByDesignation(tenantId);
  return (data ?? []).map((row) =>
    mapDesignation({
      ...row,
      employee_count: empCounts.get(row.id as string) ?? 0,
    })
  );
}

export async function createDesignation(
  tenantId: string,
  input: {
    name: string;
    status: string;
    department?: string | null;
    gradeLevel?: string | null;
    reportsToDesignationId?: string | null;
  }
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("designations")
    .insert(designationToDb({ tenantId, ...input }))
    .select("*, reports_to:reports_to_designation_id ( id, name )")
    .single();
  if (error) throw error;
  return mapDesignation({ ...data, employee_count: 0 });
}

export async function updateDesignation(
  tenantId: string,
  id: string,
  input: Partial<{
    name: string;
    status: string;
    department: string | null;
    gradeLevel: string | null;
    reportsToDesignationId: string | null;
  }>
) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.status !== undefined) payload.status = input.status;
  if (input.department !== undefined) payload.department = input.department;
  if (input.gradeLevel !== undefined) payload.grade_level = input.gradeLevel;
  if (input.reportsToDesignationId !== undefined) payload.reports_to_designation_id = input.reportsToDesignationId;

  const { data, error } = await supabase
    .from("designations")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select("*, reports_to:reports_to_designation_id ( id, name )")
    .single();
  if (error) throw error;

  const empCounts = await employeeCountsByDesignation(tenantId);
  return mapDesignation({ ...data, employee_count: empCounts.get(id) ?? 0 });
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
