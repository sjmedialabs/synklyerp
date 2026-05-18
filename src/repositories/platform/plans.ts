import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type PlanRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  planType: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  trialDays: number;
  currency: string;
  features: string[];
  modules: string[];
  userLimit: number | null;
  storageLimitMb: number | null;
  apiLimitMonthly: number | null;
  status: string;
  sortOrder: number;
};

function mapPlan(row: Record<string, unknown>): PlanRow {
  const features = row.features_json;
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    planType: row.plan_type as string,
    monthlyPriceCents: row.monthly_price_cents as number,
    yearlyPriceCents: row.yearly_price_cents as number,
    trialDays: row.trial_days as number,
    currency: row.currency as string,
    features: Array.isArray(features) ? (features as string[]) : [],
    modules: (row.modules as string[]) ?? [],
    userLimit: (row.user_limit as number | null) ?? null,
    storageLimitMb: (row.storage_limit_mb as number | null) ?? null,
    apiLimitMonthly: (row.api_limit_monthly as number | null) ?? null,
    status: row.status as string,
    sortOrder: row.sort_order as number,
  };
}

export async function listPublicPlans(): Promise<PlanRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data ?? []).map((r) => mapPlan(r as Record<string, unknown>));
}

export async function listAllPlans(): Promise<PlanRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapPlan(r as Record<string, unknown>));
}

export async function getPlanBySlug(slug: string): Promise<PlanRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  return data ? mapPlan(data as Record<string, unknown>) : null;
}

export async function getPlanById(id: string): Promise<PlanRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("plans").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  return data ? mapPlan(data as Record<string, unknown>) : null;
}

export async function upsertPlan(input: {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  planType: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  trialDays: number;
  currency: string;
  features: string[];
  modules: string[];
  userLimit?: number | null;
  storageLimitMb?: number | null;
  apiLimitMonthly?: number | null;
  status: string;
  sortOrder: number;
}) {
  const supabase = createAdminClient();
  const payload = {
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    plan_type: input.planType,
    monthly_price_cents: input.monthlyPriceCents,
    yearly_price_cents: input.yearlyPriceCents,
    trial_days: input.trialDays,
    currency: input.currency,
    features_json: input.features,
    modules: input.modules,
    user_limit: input.userLimit ?? null,
    storage_limit_mb: input.storageLimitMb ?? null,
    api_limit_monthly: input.apiLimitMonthly ?? null,
    status: input.status,
    sort_order: input.sortOrder,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase.from("plans").update(payload).eq("id", input.id).select().single();
    if (error) throw error;
    return mapPlan(data as Record<string, unknown>);
  }

  const { data, error } = await supabase.from("plans").insert(payload).select().single();
  if (error) throw error;
  return mapPlan(data as Record<string, unknown>);
}

export async function deletePlan(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("plans")
    .update({ deleted_at: new Date().toISOString(), status: "INACTIVE" })
    .eq("id", id);
  if (error) throw error;
  return { id };
}
