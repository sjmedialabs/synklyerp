import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type {
  BusinessCategoryMasterInput,
  BusinessSpecializationMasterInput,
  BusinessTypeMasterInput,
  DashboardTemplateInput,
} from "@/validators/business-masters";

function toSnakeCase(input: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    legacyKey: "legacy_key",
    themeColor: "theme_color",
    sortOrder: "sort_order",
    isActive: "is_active",
    businessTypeId: "business_type_id",
    enabledModules: "enabled_modules",
    sidebarPreset: "sidebar_preset",
    businessSubcategoryId: "business_subcategory_id",
    onboardingFormSchema: "onboarding_form_schema",
    workflowRules: "workflow_rules",
    defaultModules: "default_modules",
    enabledReports: "enabled_reports",
    quickActions: "quick_actions",
  };
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    out[map[key] ?? key] = value;
  }
  return out;
}

export async function listBusinessTypesAdmin() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("business_types")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function upsertBusinessType(input: BusinessTypeMasterInput) {
  const supabase = createAdminClient();
  const payload = toSnakeCase(input as unknown as Record<string, unknown>);

  if (input.id) {
    const { data, error } = await supabase
      .from("business_types")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from("business_types").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function softDeleteBusinessType(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("business_types")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function listBusinessCategoriesAdmin(businessTypeId?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("business_subcategories")
    .select("*, business_types(name, slug)")
    .is("deleted_at", null)
    .order("sort_order");
  if (businessTypeId) query = query.eq("business_type_id", businessTypeId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertBusinessCategory(input: BusinessCategoryMasterInput) {
  const supabase = createAdminClient();
  const payload = toSnakeCase(input as unknown as Record<string, unknown>);

  if (input.id) {
    const { data, error } = await supabase
      .from("business_subcategories")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from("business_subcategories").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function softDeleteBusinessCategory(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("business_subcategories")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function listBusinessSpecializationsAdmin(categoryId?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("business_specializations")
    .select("*, business_subcategories(name, slug)")
    .is("deleted_at", null)
    .order("sort_order");
  if (categoryId) query = query.eq("business_subcategory_id", categoryId);
  const { data, error } = await query;
  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return data ?? [];
}

export async function upsertBusinessSpecialization(input: BusinessSpecializationMasterInput) {
  const supabase = createAdminClient();
  const payload = toSnakeCase(input as unknown as Record<string, unknown>);

  if (input.id) {
    const { data, error } = await supabase
      .from("business_specializations")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from("business_specializations").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function softDeleteBusinessSpecialization(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("business_specializations")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function listDashboardTemplatesAdmin() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dashboard_templates")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order");
  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return data ?? [];
}

export async function upsertDashboardTemplate(input: DashboardTemplateInput) {
  const supabase = createAdminClient();
  const payload = toSnakeCase(input as unknown as Record<string, unknown>);

  if (input.id) {
    const { data, error } = await supabase
      .from("dashboard_templates")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from("dashboard_templates").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}
