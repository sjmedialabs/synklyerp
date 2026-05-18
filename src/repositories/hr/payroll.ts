import { createAdminClient } from "@/lib/supabase/admin";

const BASE_MONTHLY_SALARY = 45000;
const TAX_RATE = 0.1;

export type PayrollCycleRow = {
  id: string;
  month: number;
  year: number;
  status: string;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  processedAt: string | null;
  createdAt: string;
};

function mapCycle(row: Record<string, unknown>): PayrollCycleRow {
  return {
    id: row.id as string,
    month: row.month as number,
    year: row.year as number,
    status: row.status as string,
    employeeCount: Number(row.employee_count ?? 0),
    totalGross: Number(row.total_gross ?? 0),
    totalDeductions: Number(row.total_deductions ?? 0),
    totalNet: Number(row.total_net ?? 0),
    processedAt: (row.processed_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function listPayrollCycles(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payroll_cycles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => mapCycle(r as Record<string, unknown>));
}

export async function getPayrollStats(tenantId: string) {
  const supabase = createAdminClient();
  const year = new Date().getFullYear();

  const { data: cycles, error } = await supabase
    .from("payroll_cycles")
    .select("status, total_gross, total_deductions, total_net, year")
    .eq("tenant_id", tenantId);

  if (error) throw error;
  const list = cycles ?? [];

  const ytd = list.filter((c) => (c as { year: number }).year === year);
  const approved = ytd.filter((c) => (c as { status: string }).status === "APPROVED");

  const totalProcessedYtd = approved.reduce((s, c) => s + Number((c as { total_net: number }).total_net ?? 0), 0);
  const taxDeductedYtd = approved.reduce((s, c) => s + Number((c as { total_deductions: number }).total_deductions ?? 0), 0);
  const pendingApprovals = list.filter((c) => (c as { status: string }).status === "DRAFT").length;

  return {
    totalProcessedYtd,
    taxDeductedYtd,
    pendingApprovals,
    cycleCount: list.length,
  };
}

export async function createPayrollCycle(
  tenantId: string,
  input: { month: number; year: number; processedBy?: string }
) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("payroll_cycles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("month", input.month)
    .eq("year", input.year)
    .maybeSingle();

  if (existing) throw new Error("CYCLE_EXISTS");

  const { count, error: countErr } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "Active")
    .is("deleted_at", null);

  if (countErr) throw countErr;

  const employeeCount = count ?? 0;
  const totalGross = employeeCount * BASE_MONTHLY_SALARY;
  const totalDeductions = Math.round(totalGross * TAX_RATE * 100) / 100;
  const totalNet = totalGross - totalDeductions;

  const { data, error } = await supabase
    .from("payroll_cycles")
    .insert({
      tenant_id: tenantId,
      month: input.month,
      year: input.year,
      status: "DRAFT",
      employee_count: employeeCount,
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net: totalNet,
      processed_by: input.processedBy ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapCycle(data as Record<string, unknown>);
}
