import { createAdminClient } from "@/lib/supabase/admin";
import { mapChartOfAccount, chartOfAccountToDb } from "@/lib/mappers/finance-masters";
import { logFinanceActivity } from "@/repositories/finance/dashboard";
import type { PaginatedQuery } from "@/types/api";

export type ListCoaParams = PaginatedQuery & {
  accountGroupId?: string;
  accountType?: string;
  status?: string;
};

const COA_SELECT = `
  *,
  account_groups:account_group_id ( name ),
  created_by_user:created_by ( name ),
  updated_by_user:updated_by ( name )
`;

async function computeLevel(tenantId: string, parentId: string | null): Promise<number> {
  if (!parentId) return 0;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_chart_of_accounts")
    .select("level")
    .eq("tenant_id", tenantId)
    .eq("id", parentId)
    .maybeSingle();
  return data ? Number(data.level) + 1 : 0;
}

async function childCounts(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_chart_of_accounts")
    .select("parent_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .not("parent_id", "is", null);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const pid = row.parent_id as string;
    counts.set(pid, (counts.get(pid) ?? 0) + 1);
  }
  return counts;
}

export async function listChartOfAccounts(tenantId: string, params: ListCoaParams) {
  const supabase = createAdminClient();

  let query = supabase
    .from("finance_chart_of_accounts")
    .select(COA_SELECT)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("account_code");

  if (params.search) {
    query = query.or(
      `account_code.ilike.%${params.search}%,account_name.ilike.%${params.search}%`
    );
  }
  if (params.accountGroupId) query = query.eq("account_group_id", params.accountGroupId);
  if (params.accountType) query = query.eq("account_type", params.accountType);
  if (params.status === "ACTIVE") query = query.eq("is_active", true);
  if (params.status === "INACTIVE") query = query.eq("is_active", false);

  const { data, error } = await query;
  if (error) throw error;

  const counts = await childCounts(tenantId);
  const items = (data ?? []).map((row) =>
    mapChartOfAccount(row, counts.get(row.id as string) ?? 0)
  );

  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const from = (page - 1) * limit;
  const paged = items.slice(from, from + limit);

  return { items: paged, total: items.length, page, limit };
}

export async function listAllChartOfAccountsForExport(tenantId: string, params: ListCoaParams) {
  const result = await listChartOfAccounts(tenantId, { ...params, page: 1, limit: 100000 });
  return result.items;
}

export async function getChartOfAccountById(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_chart_of_accounts")
    .select(COA_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const counts = await childCounts(tenantId);
  return mapChartOfAccount(data, counts.get(id) ?? 0);
}

export async function createChartOfAccount(
  tenantId: string,
  userId: string | null,
  input: Parameters<typeof chartOfAccountToDb>[0]
) {
  const supabase = createAdminClient();
  const level = await computeLevel(tenantId, input.parentId ?? null);

  const { data, error } = await supabase
    .from("finance_chart_of_accounts")
    .insert(
      chartOfAccountToDb({
        ...input,
        tenantId,
        level,
        createdBy: userId,
        updatedBy: userId,
      })
    )
    .select(COA_SELECT)
    .single();
  if (error) throw error;

  const account = mapChartOfAccount(data, 0);
  await logFinanceActivity(tenantId, {
    activityType: "COA_CREATED",
    referenceNo: account.accountCode,
    title: `Account ${account.accountName} created`,
    actorUserId: userId,
  });

  return account;
}

export async function updateChartOfAccount(
  tenantId: string,
  id: string,
  userId: string | null,
  input: Partial<Parameters<typeof chartOfAccountToDb>[0]>
) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_by: userId };

  if (input.parentId !== undefined) {
    payload.parent_id = input.parentId;
    payload.level = await computeLevel(tenantId, input.parentId ?? null);
  }
  if (input.accountCode !== undefined) payload.account_code = input.accountCode;
  if (input.accountName !== undefined) payload.account_name = input.accountName;
  if (input.description !== undefined) payload.description = input.description;
  if (input.accountGroupId !== undefined) payload.account_group_id = input.accountGroupId;
  if (input.accountType !== undefined) payload.account_type = input.accountType;
  if (input.accountCategory !== undefined) payload.account_category = input.accountCategory;
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.allowManualEntry !== undefined) payload.allow_manual_entry = input.allowManualEntry;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  if (input.costCenterApplicable !== undefined) payload.cost_center_applicable = input.costCenterApplicable;
  if (input.budgetControl !== undefined) payload.budget_control = input.budgetControl;
  if (input.balanceSheetClassification !== undefined) {
    payload.balance_sheet_classification = input.balanceSheetClassification;
  }
  if (input.profitLossClassification !== undefined) {
    payload.profit_loss_classification = input.profitLossClassification;
  }
  if (input.taxCategory !== undefined) payload.tax_category = input.taxCategory;
  if (input.vatGstApplicable !== undefined) payload.vat_gst_applicable = input.vatGstApplicable;
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from("finance_chart_of_accounts")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select(COA_SELECT)
    .single();
  if (error) throw error;

  const account = mapChartOfAccount(data, 0);
  await logFinanceActivity(tenantId, {
    activityType: "COA_UPDATED",
    referenceNo: account.accountCode,
    title: `Account ${account.accountName} updated`,
    actorUserId: userId,
  });

  return account;
}

export async function deleteChartOfAccount(tenantId: string, id: string, userId: string | null) {
  const supabase = createAdminClient();
  const existing = await getChartOfAccountById(tenantId, id);
  if (!existing) return { id };

  const { error } = await supabase
    .from("finance_chart_of_accounts")
    .update({ deleted_at: new Date().toISOString(), updated_by: userId })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;

  await logFinanceActivity(tenantId, {
    activityType: "COA_DELETED",
    referenceNo: existing.accountCode,
    title: `Account ${existing.accountName} deleted`,
    actorUserId: userId,
  });

  return { id };
}

export async function listChartOfAccountOptions(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_chart_of_accounts")
    .select("id, account_code, account_name, account_type, level")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("account_code");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    accountCode: row.account_code as string,
    accountName: row.account_name as string,
    accountType: row.account_type as string,
    level: Number(row.level ?? 0),
  }));
}

export async function listCoaFilterOptions(tenantId: string) {
  const supabase = createAdminClient();
  const { data: groups } = await supabase
    .from("finance_account_groups")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("name");

  const { data: types } = await supabase
    .from("finance_chart_of_accounts")
    .select("account_type")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  const accountTypes = [...new Set((types ?? []).map((r) => r.account_type as string))].sort();

  return {
    accountGroups: (groups ?? []).map((g) => ({ id: g.id as string, name: g.name as string })),
    accountTypes,
  };
}
