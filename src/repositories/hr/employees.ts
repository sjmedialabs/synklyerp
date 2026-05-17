import { createAdminClient } from "@/lib/supabase/admin";
import { mapEmployee } from "@/lib/mappers/modules";
import type { PaginatedQuery } from "@/types/api";

const employeeSelect = `
  *,
  designations:designation_id ( id, name ),
  branches:branch_id ( id, name ),
  divisions:division_id ( id, name ),
  manager:reporting_to_id ( id, full_name )
`;

export async function nextEmployeeCode(tenantId: string) {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  return `EMP-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function listEmployees(tenantId: string, params: PaginatedQuery & { branchId?: string }) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;

  let query = supabase
    .from("employees")
    .select(employeeSelect, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.branchId) query = query.eq("branch_id", params.branchId);
  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,employee_code.ilike.%${params.search}%,work_email.ilike.%${params.search}%`);
  }

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapEmployee), total: count ?? 0, page, limit };
}

export async function getEmployeeStats(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("employees").select("status, created_at").eq("tenant_id", tenantId).is("deleted_at", null);
  const list = data ?? [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    total: list.length,
    active: list.filter((e) => e.status === "Active").length,
    onProbation: list.filter((e) => e.status === "On Probation").length,
    newThisMonth: list.filter((e) => new Date(e.created_at as string) >= monthStart).length,
  };
}

export async function getEmployee(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select(employeeSelect)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return mapEmployee(data);
}

export async function createEmployee(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const code = input.employeeCode ? String(input.employeeCode) : await nextEmployeeCode(tenantId);
  const { data, error } = await supabase
    .from("employees")
    .insert({
      tenant_id: tenantId,
      employee_code: code,
      full_name: String(input.fullName),
      date_of_joining: String(input.dateOfJoining),
      designation_id: String(input.designationId),
      department: input.department ? String(input.department) : null,
      branch_id: String(input.branchId),
      division_id: String(input.divisionId),
      employment_type: String(input.employmentType),
      status: String(input.status),
      work_email: input.workEmail ? String(input.workEmail) : null,
      personal_email: input.personalEmail ? String(input.personalEmail) : null,
      phone_number: input.phoneNumber ? String(input.phoneNumber) : null,
      emergency_contact: input.emergencyContact ? String(input.emergencyContact) : null,
      reporting_to_id: input.reportingToId || null,
      is_draft: Boolean(input.isDraft),
    })
    .select(employeeSelect)
    .single();
  if (error) throw error;
  return mapEmployee(data);
}

export async function updateEmployee(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.fullName !== undefined) payload.full_name = input.fullName;
  if (input.dateOfJoining !== undefined) payload.date_of_joining = input.dateOfJoining;
  if (input.designationId !== undefined) payload.designation_id = input.designationId;
  if (input.department !== undefined) payload.department = input.department || null;
  if (input.branchId !== undefined) payload.branch_id = input.branchId;
  if (input.divisionId !== undefined) payload.division_id = input.divisionId;
  if (input.employmentType !== undefined) payload.employment_type = input.employmentType;
  if (input.status !== undefined) payload.status = input.status;
  if (input.workEmail !== undefined) payload.work_email = input.workEmail || null;
  if (input.personalEmail !== undefined) payload.personal_email = input.personalEmail || null;
  if (input.phoneNumber !== undefined) payload.phone_number = input.phoneNumber || null;
  if (input.emergencyContact !== undefined) payload.emergency_contact = input.emergencyContact || null;
  if (input.reportingToId !== undefined) payload.reporting_to_id = input.reportingToId || null;
  if (input.isDraft !== undefined) payload.is_draft = input.isDraft;
  const { data, error } = await supabase.from("employees").update(payload).eq("tenant_id", tenantId).eq("id", id).is("deleted_at", null).select(employeeSelect).single();
  if (error) throw error;
  return mapEmployee(data);
}

export async function deleteEmployee(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("employees").update({ deleted_at: new Date().toISOString() }).eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
  return { id };
}
