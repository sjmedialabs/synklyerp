import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapFinancialDimension,
  mapDimensionValue,
  financialDimensionToDb,
  dimensionValueToDb,
} from "@/lib/mappers/finance-masters";
import type { PaginatedQuery } from "@/types/api";

export type ListDimensionsParams = PaginatedQuery & {
  status?: string;
};

const DIMENSION_SELECT = `
  *,
  created_by_user:created_by ( name ),
  updated_by_user:updated_by ( name )
`;

async function valueCountsByDimension(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("finance_financial_dimension_values")
    .select("dimension_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const did = row.dimension_id as string;
    counts.set(did, (counts.get(did) ?? 0) + 1);
  }
  return counts;
}

export async function listFinancialDimensions(tenantId: string, params: ListDimensionsParams) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("finance_financial_dimensions")
    .select(DIMENSION_SELECT, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("dimension_code");

  if (params.search) {
    query = query.or(
      `dimension_name.ilike.%${params.search}%,dimension_code.ilike.%${params.search}%`
    );
  }
  if (params.status === "ACTIVE") query = query.eq("is_active", true);
  if (params.status === "INACTIVE") query = query.eq("is_active", false);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const valueCounts = await valueCountsByDimension(tenantId);
  return {
    items: (data ?? []).map((row) =>
      mapFinancialDimension(row, valueCounts.get(row.id as string) ?? 0)
    ),
    total: count ?? 0,
    page,
    limit,
  };
}

export async function getFinancialDimensionById(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_financial_dimensions")
    .select(DIMENSION_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const valueCounts = await valueCountsByDimension(tenantId);
  return mapFinancialDimension(data, valueCounts.get(id) ?? 0);
}

export async function getFinancialDimensionStats(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_financial_dimensions")
    .select("id, is_active")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);
  if (error) throw error;

  const dims = data ?? [];
  const total = dims.length;
  const active = dims.filter((d) => d.is_active).length;
  const inactive = total - active;

  const { count: totalValues } = await supabase
    .from("finance_financial_dimension_values")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  return { total, active, inactive, totalValues: totalValues ?? 0 };
}

export async function createFinancialDimension(
  tenantId: string,
  userId: string | null,
  input: Parameters<typeof financialDimensionToDb>[0]
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_financial_dimensions")
    .insert(
      financialDimensionToDb({
        ...input,
        tenantId,
        createdBy: userId,
        updatedBy: userId,
      })
    )
    .select(DIMENSION_SELECT)
    .single();
  if (error) throw error;
  return mapFinancialDimension(data, 0);
}

export async function updateFinancialDimension(
  tenantId: string,
  id: string,
  userId: string | null,
  input: Partial<Parameters<typeof financialDimensionToDb>[0]>
) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_by: userId };
  if (input.dimensionCode !== undefined) payload.dimension_code = input.dimensionCode;
  if (input.dimensionName !== undefined) payload.dimension_name = input.dimensionName;
  if (input.description !== undefined) payload.description = input.description;
  if (input.dataType !== undefined) payload.data_type = input.dataType;
  if (input.allowMultipleValues !== undefined) payload.allow_multiple_values = input.allowMultipleValues;
  if (input.isActive !== undefined) payload.is_active = input.isActive;

  const { data, error } = await supabase
    .from("finance_financial_dimensions")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select(DIMENSION_SELECT)
    .single();
  if (error) throw error;

  const valueCounts = await valueCountsByDimension(tenantId);
  return mapFinancialDimension(data, valueCounts.get(id) ?? 0);
}

export async function deleteFinancialDimension(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("finance_financial_dimensions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
  return { id };
}

export async function listDimensionValues(tenantId: string, dimensionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_financial_dimension_values")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("dimension_id", dimensionId)
    .is("deleted_at", null)
    .order("sort_order")
    .order("value_code");
  if (error) throw error;
  return (data ?? []).map(mapDimensionValue);
}

export async function createDimensionValue(
  tenantId: string,
  dimensionId: string,
  input: Omit<Parameters<typeof dimensionValueToDb>[0], "tenantId" | "dimensionId">
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_financial_dimension_values")
    .insert(dimensionValueToDb({ ...input, tenantId, dimensionId }))
    .select("*")
    .single();
  if (error) throw error;
  return mapDimensionValue(data);
}

export async function updateDimensionValue(
  tenantId: string,
  id: string,
  input: Partial<Omit<Parameters<typeof dimensionValueToDb>[0], "tenantId" | "dimensionId">>
) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.valueCode !== undefined) payload.value_code = input.valueCode;
  if (input.valueName !== undefined) payload.value_name = input.valueName;
  if (input.description !== undefined) payload.description = input.description;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from("finance_financial_dimension_values")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();
  if (error) throw error;
  return mapDimensionValue(data);
}

export async function deleteDimensionValue(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("finance_financial_dimension_values")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
  return { id };
}
