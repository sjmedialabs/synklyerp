import { createAdminClient } from "@/lib/supabase/admin";
import { mapAttendance } from "@/lib/mappers/modules";
import type { PaginatedQuery } from "@/types/api";

const attendanceSelect = `*, employees:employee_id ( id, full_name, employee_code )`;

export async function listAttendance(tenantId: string, params: PaginatedQuery & { date?: string }) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 100;
  const from = (page - 1) * limit;

  const { data: employees } = await supabase.from("employees").select("id").eq("tenant_id", tenantId).is("deleted_at", null);
  const ids = (employees ?? []).map((e) => e.id);
  if (ids.length === 0) return { items: [], total: 0, page, limit };

  let query = supabase
    .from("attendances")
    .select(attendanceSelect, { count: "exact" })
    .in("employee_id", ids)
    .order("date", { ascending: false });

  if (params.date) query = query.eq("date", params.date);
  if (params.status) query = query.eq("status", params.status);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapAttendance), total: count ?? 0, page, limit };
}

export async function getAttendanceSummary(tenantId: string, date: string) {
  const supabase = createAdminClient();
  const { data: employees } = await supabase.from("employees").select("id").eq("tenant_id", tenantId).is("deleted_at", null);
  const ids = (employees ?? []).map((e) => e.id);
  if (ids.length === 0) return { present: 0, late: 0, absent: 0, onLeave: 0 };

  const { data } = await supabase.from("attendances").select("status").in("employee_id", ids).eq("date", date);
  const list = data ?? [];
  return {
    present: list.filter((r) => r.status === "Present").length,
    late: list.filter((r) => r.status === "Late").length,
    absent: list.filter((r) => r.status === "Absent").length,
    onLeave: list.filter((r) => r.status === "On Leave").length,
  };
}

export async function upsertAttendance(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data: emp } = await supabase.from("employees").select("id").eq("tenant_id", tenantId).eq("id", input.employeeId).single();
  if (!emp) throw new Error("NOT_FOUND");

  const { data, error } = await supabase
    .from("attendances")
    .upsert(
      {
        employee_id: String(input.employeeId),
        date: String(input.date),
        punch_in: input.punchIn || null,
        punch_out: input.punchOut || null,
        status: String(input.status),
        ot_hours: Number(input.otHours ?? 0),
        flags: input.flags ? String(input.flags) : null,
      },
      { onConflict: "employee_id,date" }
    )
    .select(attendanceSelect)
    .single();
  if (error) throw error;
  return mapAttendance(data);
}
