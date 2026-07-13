import { createAdminClient } from "@/lib/supabase/admin";
import {
  FINANCE_MODULE_DESCRIPTIONS,
  FINANCE_REPORT_DESCRIPTIONS,
} from "@/lib/finance/menu-structure";

export type FinanceDashboardStats = {
  totalReceivables: number;
  totalPayables: number;
  cashBankBalance: number;
  totalIncomeMtd: number;
  totalExpenseMtd: number;
  receivablesTrendPct: number | null;
  payablesTrendPct: number | null;
  cashTrendPct: number | null;
  incomeTrendPct: number | null;
  expenseTrendPct: number | null;
};

export type FinanceDashboardModule = {
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  path: string | null;
  firstChildPath: string | null;
  childCount: number;
};

export type FinanceDashboardReport = {
  slug: string;
  name: string;
  description: string;
  path: string;
  icon: string | null;
};

export type FinanceActivity = {
  id: string;
  activityType: string;
  referenceNo: string | null;
  title: string;
  description: string | null;
  actorName: string | null;
  occurredAt: string;
};

function monthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

function prevMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString().slice(0, 10);
}

function prevMonthEnd(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 0).toISOString().slice(0, 10);
}

function trendPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

async function sumOutstandingReceivables(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_customer_invoices")
    .select("amount, paid_amount")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .in("status", ["OPEN", "PARTIAL"]);

  return (data ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0) - Number(row.paid_amount ?? 0),
    0
  );
}

async function sumOutstandingPayables(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_vendor_bills")
    .select("amount, paid_amount")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .in("status", ["OPEN", "PARTIAL"]);

  return (data ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0) - Number(row.paid_amount ?? 0),
    0
  );
}

async function sumCashBankBalance(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_bank_accounts")
    .select("current_balance")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("status", "ACTIVE");

  return (data ?? []).reduce((sum, row) => sum + Number(row.current_balance ?? 0), 0);
}

async function sumReceiptsBetween(tenantId: string, from: string, to: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_customer_receipts")
    .select("amount")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("receipt_date", from)
    .lte("receipt_date", to);

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

async function sumPaymentsBetween(tenantId: string, from: string, to: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_vendor_payments")
    .select("amount")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("payment_date", from)
    .lte("payment_date", to);

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

export async function getFinanceDashboardStats(tenantId: string): Promise<FinanceDashboardStats> {
  const today = new Date();
  const mtdStart = monthStart(today);
  const todayStr = today.toISOString().slice(0, 10);
  const prevStart = prevMonthStart(today);
  const prevEnd = prevMonthEnd(today);

  const [
    totalReceivables,
    totalPayables,
    cashBankBalance,
    totalIncomeMtd,
    totalExpenseMtd,
    incomePrev,
    expensePrev,
  ] = await Promise.all([
    sumOutstandingReceivables(tenantId),
    sumOutstandingPayables(tenantId),
    sumCashBankBalance(tenantId),
    sumReceiptsBetween(tenantId, mtdStart, todayStr),
    sumPaymentsBetween(tenantId, mtdStart, todayStr),
    sumReceiptsBetween(tenantId, prevStart, prevEnd),
    sumPaymentsBetween(tenantId, prevStart, prevEnd),
  ]);

  return {
    totalReceivables,
    totalPayables,
    cashBankBalance,
    totalIncomeMtd,
    totalExpenseMtd,
    receivablesTrendPct: null,
    payablesTrendPct: null,
    cashTrendPct: null,
    incomeTrendPct: trendPct(totalIncomeMtd, incomePrev),
    expenseTrendPct: trendPct(totalExpenseMtd, expensePrev),
  };
}

export async function listFinanceDashboardModules(tenantId: string): Promise<FinanceDashboardModule[]> {
  const supabase = createAdminClient();

  const { data: financeRoot } = await supabase
    .from("sidebar_menus")
    .select("id")
    .eq("slug", "finance")
    .is("deleted_at", null)
    .maybeSingle();

  if (!financeRoot?.id) return [];

  const { data: groups } = await supabase
    .from("sidebar_menus")
    .select("id, slug, name, icon, path, sort_order")
    .eq("parent_id", financeRoot.id)
    .eq("menu_type", "group")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order");

  const modules: FinanceDashboardModule[] = [];

  for (const group of groups ?? []) {
    const { data: children } = await supabase
      .from("sidebar_menus")
      .select("path")
      .eq("parent_id", group.id)
      .is("deleted_at", null)
      .not("path", "is", null)
      .order("sort_order")
      .limit(1);

    const { count } = await supabase
      .from("sidebar_menus")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", group.id)
      .is("deleted_at", null);

    modules.push({
      slug: String(group.slug),
      name: String(group.name),
      description: FINANCE_MODULE_DESCRIPTIONS[String(group.slug)] ?? `${group.name} workspace.`,
      icon: (group.icon as string | null) ?? null,
      path: (group.path as string | null) ?? null,
      firstChildPath: (children?.[0]?.path as string | null) ?? null,
      childCount: count ?? 0,
    });
  }

  return modules;
}

export async function listFinanceDashboardReports(tenantId: string): Promise<FinanceDashboardReport[]> {
  const supabase = createAdminClient();

  const { data: reportsGroup } = await supabase
    .from("sidebar_menus")
    .select("id")
    .eq("slug", "finance-reports-analytics")
    .is("deleted_at", null)
    .maybeSingle();

  if (!reportsGroup?.id) return [];

  const { data: items } = await supabase
    .from("sidebar_menus")
    .select("slug, name, path, icon, sort_order")
    .eq("parent_id", reportsGroup.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("path", "is", null)
    .order("sort_order")
    .limit(8);

  return (items ?? []).map((row) => ({
    slug: String(row.slug),
    name: String(row.name),
    description: FINANCE_REPORT_DESCRIPTIONS[String(row.slug)] ?? `${row.name} report.`,
    path: String(row.path),
    icon: (row.icon as string | null) ?? null,
  }));
}

export async function listFinanceRecentActivities(tenantId: string, limit = 8): Promise<FinanceActivity[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_activity_logs")
    .select("id, activity_type, reference_no, title, description, actor_name, occurred_at")
    .eq("tenant_id", tenantId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    activityType: String(row.activity_type),
    referenceNo: (row.reference_no as string | null) ?? null,
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    actorName: (row.actor_name as string | null) ?? null,
    occurredAt: String(row.occurred_at),
  }));
}

export async function logFinanceActivity(
  tenantId: string,
  input: {
    activityType: string;
    referenceNo?: string | null;
    title: string;
    description?: string | null;
    actorUserId?: string | null;
    actorName?: string | null;
    metadata?: Record<string, unknown>;
    occurredAt?: string;
  }
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_activity_logs")
    .insert({
      tenant_id: tenantId,
      activity_type: input.activityType,
      reference_no: input.referenceNo ?? null,
      title: input.title,
      description: input.description ?? null,
      actor_user_id: input.actorUserId ?? null,
      actor_name: input.actorName ?? null,
      metadata: input.metadata ?? {},
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
