import { createAdminClient } from "@/lib/supabase/admin";
import { mapCostCenter, costCenterToDb } from "@/lib/mappers/finance-masters";
import type { PaginatedQuery } from "@/types/api";

export type ListCostCentersParams = PaginatedQuery & {
  status?: string;
  costCenterType?: string;
};

const CC_SELECT = `
  *,
  parent:parent_id ( cost_center_code, cost_center_name ),
  created_by_user:created_by ( name ),
  updated_by_user:updated_by ( name )
`;

async function computeLevel(tenantId: string, parentId: string | null): Promise<number> {
  if (!parentId) return 0;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_cost_centers")
    .select("level")
    .eq("tenant_id", tenantId)
    .eq("id", parentId)
    .maybeSingle();
  return data ? Number(data.level) + 1 : 0;
}

export async function listCostCenters(tenantId: string, params: ListCostCentersParams) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("finance_cost_centers")
    .select(CC_SELECT, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("cost_center_code");

  if (params.search) {
    query = query.or(
      `cost_center_name.ilike.%${params.search}%,cost_center_code.ilike.%${params.search}%`
    );
  }
  if (params.status) query = query.eq("status", params.status);
  if (params.costCenterType) query = query.eq("cost_center_type", params.costCenterType);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    items: (data ?? []).map(mapCostCenter),
    total: count ?? 0,
    page,
    limit,
  };
}

export async function listAllCostCentersForExport(tenantId: string, params: ListCostCentersParams) {
  const result = await listCostCenters(tenantId, { ...params, page: 1, limit: 100000 });
  return result.items;
}

export async function getCostCenterById(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_cost_centers")
    .select(CC_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapCostCenter(data);
}

export async function getCostCenterStats(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_cost_centers")
    .select("status, budget_amount")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);
  if (error) throw error;

  const items = data ?? [];
  const total = items.length;
  const active = items.filter((i) => i.status === "ACTIVE").length;
  const inactive = total - active;
  const totalBudget = items.reduce((sum, i) => sum + Number(i.budget_amount ?? 0), 0);

  return { total, active, inactive, totalBudget };
}

export async function createCostCenter(
  tenantId: string,
  userId: string | null,
  input: Parameters<typeof costCenterToDb>[0]
) {
  const supabase = createAdminClient();
  const level = await computeLevel(tenantId, input.parentId ?? null);

  const { data, error } = await supabase
    .from("finance_cost_centers")
    .insert(
      costCenterToDb({
        ...input,
        tenantId,
        level,
        createdBy: userId,
        updatedBy: userId,
      })
    )
    .select(CC_SELECT)
    .single();
  if (error) throw error;
  return mapCostCenter(data);
}

export async function updateCostCenter(
  tenantId: string,
  id: string,
  userId: string | null,
  input: Partial<Parameters<typeof costCenterToDb>[0]>
) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_by: userId };
  if (input.parentId !== undefined) {
    payload.parent_id = input.parentId;
    payload.level = await computeLevel(tenantId, input.parentId ?? null);
  }
  if (input.costCenterCode !== undefined) payload.cost_center_code = input.costCenterCode;
  if (input.costCenterName !== undefined) payload.cost_center_name = input.costCenterName;
  if (input.costCenterType !== undefined) payload.cost_center_type = input.costCenterType;
  if (input.managerName !== undefined) payload.manager_name = input.managerName;
  if (input.location !== undefined) payload.location = input.location;
  if (input.description !== undefined) payload.description = input.description;
  if (input.status !== undefined) payload.status = input.status;
  if (input.budgetAmount !== undefined) payload.budget_amount = input.budgetAmount;
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.allowManualEntry !== undefined) payload.allow_manual_entry = input.allowManualEntry;
  if (input.includeInBudget !== undefined) payload.include_in_budget = input.includeInBudget;
  if (input.allowTransactions !== undefined) payload.allow_transactions = input.allowTransactions;
  if (input.isBillable !== undefined) payload.is_billable = input.isBillable;

  const { data, error } = await supabase
    .from("finance_cost_centers")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select(CC_SELECT)
    .single();
  if (error) throw error;
  return mapCostCenter(data);
}

export async function deleteCostCenter(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("finance_cost_centers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
  return { id };
}

export async function listParentCostCenterOptions(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_cost_centers")
    .select("id, cost_center_code, cost_center_name")
    .eq("tenant_id", tenantId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("cost_center_code");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    costCenterCode: r.cost_center_code as string,
    costCenterName: r.cost_center_name as string,
  }));
}
