import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type BusinessSpecializationRecord = {
  id: string;
  businessSubcategoryId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  onboardingFormSchema: unknown[];
  workflowRules: unknown[];
  defaultModules: string[];
  enabledReports: string[];
  dashboardTemplateId: string | null;
  isActive: boolean;
  sortOrder: number;
};

function mapRow(row: Record<string, unknown>): BusinessSpecializationRecord {
  return {
    id: String(row.id),
    businessSubcategoryId: String(row.business_subcategory_id),
    name: String(row.name),
    slug: String(row.slug),
    description: (row.description as string | null) ?? null,
    icon: (row.icon as string | null) ?? null,
    onboardingFormSchema: Array.isArray(row.onboarding_form_schema) ? row.onboarding_form_schema : [],
    workflowRules: Array.isArray(row.workflow_rules) ? row.workflow_rules : [],
    defaultModules: Array.isArray(row.default_modules) ? (row.default_modules as string[]) : [],
    enabledReports: Array.isArray(row.enabled_reports) ? (row.enabled_reports as string[]) : [],
    dashboardTemplateId: (row.dashboard_template_id as string | null) ?? null,
    isActive: Boolean(row.is_active ?? true),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function listSpecializationsByCategory(
  categoryId: string
): Promise<BusinessSpecializationRecord[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("business_specializations")
      .select("*")
      .eq("business_subcategory_id", categoryId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order")
      .order("name");

    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getSpecializationById(id: string): Promise<BusinessSpecializationRecord | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("business_specializations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (isMissingSchemaError(error)) return null;
      throw error;
    }
    return data ? mapRow(data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function listAllSpecializations(): Promise<BusinessSpecializationRecord[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("business_specializations")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order");

    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}
