import { createAdminClient } from "@/lib/supabase/admin";
import { mapAccountGroup, accountGroupToDb } from "@/lib/mappers/finance-masters";
import type { PaginatedQuery } from "@/types/api";

export type ListAccountGroupsParams = PaginatedQuery & {
  status?: string;
  groupType?: string;
};

const GROUP_SELECT = `
  *,
  parent:parent_id ( code, name ),
  created_by_user:created_by ( name ),
  updated_by_user:updated_by ( name )
`;

async function accountCountsByGroup(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_chart_of_accounts")
    .select("account_group_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .not("account_group_id", "is", null);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const gid = row.account_group_id as string;
    counts.set(gid, (counts.get(gid) ?? 0) + 1);
  }
  return counts;
}

async function computeLevel(tenantId: string, parentId: string | null): Promise<number> {
  if (!parentId) return 0;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_account_groups")
    .select("level")
    .eq("tenant_id", tenantId)
    .eq("id", parentId)
    .maybeSingle();
  return data ? Number(data.level) + 1 : 0;
}

export async function listAccountGroups(tenantId: string, params: ListAccountGroupsParams) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("finance_account_groups")
    .select(GROUP_SELECT, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("code");

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,code.ilike.%${params.search}%`);
  }
  if (params.status) query = query.eq("status", params.status);
  if (params.groupType) query = query.eq("group_type", params.groupType);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const counts = await accountCountsByGroup(tenantId);
  return {
    items: (data ?? []).map((row) => mapAccountGroup(row, counts.get(row.id as string) ?? 0)),
    total: count ?? 0,
    page,
    limit,
  };
}

export async function listAllAccountGroups(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_account_groups")
    .select(GROUP_SELECT)
    .eq("tenant_id", tenantId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("code");

  if (error) throw error;
  const counts = await accountCountsByGroup(tenantId);
  return (data ?? []).map((row) => mapAccountGroup(row, counts.get(row.id as string) ?? 0));
}

export async function listAllAccountGroupsForExport(tenantId: string, params: ListAccountGroupsParams) {
  const result = await listAccountGroups(tenantId, { ...params, page: 1, limit: 100000 });
  return result.items;
}

export async function getAccountGroupById(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_account_groups")
    .select(GROUP_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const counts = await accountCountsByGroup(tenantId);
  return mapAccountGroup(data, counts.get(id) ?? 0);
}

export async function getAccountGroupStats(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_account_groups")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);
  if (error) throw error;

  const groups = data ?? [];
  const total = groups.length;
  const active = groups.filter((g) => g.status === "ACTIVE").length;
  const inactive = total - active;

  const { count: mappedAccounts } = await supabase
    .from("finance_chart_of_accounts")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .not("account_group_id", "is", null);

  return { total, active, inactive, mappedAccounts: mappedAccounts ?? 0 };
}

export async function createAccountGroup(
  tenantId: string,
  userId: string | null,
  input: Parameters<typeof accountGroupToDb>[0]
) {
  const supabase = createAdminClient();
  const level = await computeLevel(tenantId, input.parentId ?? null);

  const { data, error } = await supabase
    .from("finance_account_groups")
    .insert(
      accountGroupToDb({
        ...input,
        tenantId,
        level,
        createdBy: userId,
        updatedBy: userId,
      })
    )
    .select(GROUP_SELECT)
    .single();
  if (error) throw error;
  return mapAccountGroup(data, 0);
}

export async function updateAccountGroup(
  tenantId: string,
  id: string,
  userId: string | null,
  input: Partial<Parameters<typeof accountGroupToDb>[0]>
) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_by: userId };
  if (input.parentId !== undefined) {
    payload.parent_id = input.parentId;
    payload.level = await computeLevel(tenantId, input.parentId ?? null);
  }
  if (input.code !== undefined) payload.code = input.code;
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.groupType !== undefined) payload.group_type = input.groupType;
  if (input.status !== undefined) payload.status = input.status;
  if (input.allowManualMapping !== undefined) payload.allow_manual_mapping = input.allowManualMapping;
  if (input.budgetApplicable !== undefined) payload.budget_applicable = input.budgetApplicable;
  if (input.showInReports !== undefined) payload.show_in_reports = input.showInReports;
  if (input.costCenterApplicable !== undefined) payload.cost_center_applicable = input.costCenterApplicable;
  if (input.profitCenterApplicable !== undefined) payload.profit_center_applicable = input.profitCenterApplicable;

  const { data, error } = await supabase
    .from("finance_account_groups")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select(GROUP_SELECT)
    .single();
  if (error) throw error;

  const counts = await accountCountsByGroup(tenantId);
  return mapAccountGroup(data, counts.get(id) ?? 0);
}

export async function deleteAccountGroup(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("finance_account_groups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
  return { id };
}

export async function listParentGroupOptions(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_account_groups")
    .select("id, code, name, group_type")
    .eq("tenant_id", tenantId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("code");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    groupType: r.group_type as string,
  }));
}
