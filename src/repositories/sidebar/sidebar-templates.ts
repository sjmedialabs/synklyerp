import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type SidebarTemplateRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  businessTypeId: string | null;
  businessSubcategoryId: string | null;
  businessSpecializationId: string | null;
  isDefault: boolean;
  requiredPlan: string | null;
  isActive: boolean;
  menuIds: string[];
};

export async function resolveTenantSidebarTemplate(tenantId: string): Promise<SidebarTemplateRecord | null> {
  try {
    const supabase = createAdminClient();

    const { data: config } = await supabase
      .from("tenant_sidebar_configs")
      .select("template_id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (config?.template_id) {
      return getTemplateById(config.template_id as string);
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("business_type, plan_id, plans:plan_id(slug)")
      .eq("id", tenantId)
      .maybeSingle();

    const businessType = (tenant as { business_type?: string } | null)?.business_type;
    const planSlug = unwrapJoin((tenant as { plans?: { slug: string } | null } | null)?.plans)?.slug;

    if (businessType) {
      const { data: bt } = await supabase
        .from("business_types")
        .select("id, slug")
        .eq("legacy_key", businessType)
        .maybeSingle();

      if (!bt) {
        const { data: btSlug } = await supabase
          .from("business_types")
          .select("id, slug")
          .ilike("slug", businessType.toLowerCase())
          .maybeSingle();
        if (btSlug) {
          const template = await findTemplateForBusinessType(btSlug.id as string);
          if (template) return template;
        }
      } else {
        const template = await findTemplateForBusinessType(bt.id as string);
        if (template) return template;
      }
    }

    const { data: defaultTpl } = await supabase
      .from("sidebar_templates")
      .select("id")
      .eq("is_default", true)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order")
      .limit(1)
      .maybeSingle();

    if (defaultTpl?.id) return getTemplateById(defaultTpl.id as string);

    void planSlug;
    return null;
  } catch {
    return null;
  }
}

async function findTemplateForBusinessType(businessTypeId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("sidebar_templates")
    .select("id")
    .eq("business_type_id", businessTypeId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  return data?.id ? getTemplateById(data.id as string) : null;
}

export async function getTemplateById(id: string): Promise<SidebarTemplateRecord | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("sidebar_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (isMissingSchemaError(error)) return null;
      throw error;
    }
    if (!data) return null;

    const { data: items } = await supabase
      .from("sidebar_template_items")
      .select("menu_id")
      .eq("template_id", id)
      .eq("is_visible", true)
      .order("sort_order");

    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      description: (row.description as string | null) ?? null,
      businessTypeId: (row.business_type_id as string | null) ?? null,
      businessSubcategoryId: (row.business_subcategory_id as string | null) ?? null,
      businessSpecializationId: (row.business_specialization_id as string | null) ?? null,
      isDefault: Boolean(row.is_default),
      requiredPlan: (row.required_plan as string | null) ?? null,
      isActive: Boolean(row.is_active ?? true),
      menuIds: (items ?? []).map((i) => (i as { menu_id: string }).menu_id),
    };
  } catch {
    return null;
  }
}

export async function getTenantSidebarConfig(tenantId: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tenant_sidebar_configs")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) {
      if (isMissingSchemaError(error)) return null;
      throw error;
    }
    return data as {
      template_id: string | null;
      hidden_menu_slugs: string[];
      custom_order: Record<string, number>;
    } | null;
  } catch {
    return null;
  }
}

export async function assignSidebarTemplate(tenantId: string, templateId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenant_sidebar_configs")
    .upsert(
      { tenant_id: tenantId, template_id: templateId, updated_at: new Date().toISOString() },
      { onConflict: "tenant_id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}
