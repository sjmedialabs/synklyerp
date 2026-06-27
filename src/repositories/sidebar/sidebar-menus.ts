import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { SidebarMenuRecord } from "@/lib/sidebar/types";

function mapRow(row: Record<string, unknown>): SidebarMenuRecord {
  return {
    id: String(row.id),
    parentId: (row.parent_id as string | null) ?? null,
    name: String(row.name),
    slug: String(row.slug),
    path: (row.path as string | null) ?? null,
    icon: (row.icon as string | null) ?? null,
    moduleKey: (row.module_key as string | null) ?? null,
    menuType: (row.menu_type as SidebarMenuRecord["menuType"]) ?? "item",
    permissionModule: (row.permission_module as string | null) ?? null,
    permissionFeature: (row.permission_feature as string | null) ?? null,
    permissionAction: String(row.permission_action ?? "read"),
    sortOrder: Number(row.sort_order ?? 0),
    isVisible: Boolean(row.is_visible ?? true),
    isActive: Boolean(row.is_active ?? true),
    isSystem: Boolean(row.is_system ?? false),
    isAlwaysVisible: Boolean(row.is_always_visible ?? false),
    level: Number(row.level ?? 0),
    requiredPlan: (row.required_plan as string | null) ?? null,
    requiredBusinessTypes: Array.isArray(row.required_business_types)
      ? (row.required_business_types as string[])
      : [],
    hiddenForBusinessTypes: Array.isArray(row.hidden_for_business_types)
      ? (row.hidden_for_business_types as string[])
      : [],
    requiredSubmodules: Array.isArray(row.required_submodules)
      ? (row.required_submodules as string[])
      : [],
    featureFlagKey: (row.feature_flag_key as string | null) ?? null,
    badge: (row.badge as string | null) ?? null,
    status: String(row.status ?? "built"),
  };
}

export async function listAllSidebarMenus(): Promise<SidebarMenuRecord[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("sidebar_menus")
      .select("*")
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

export async function getSidebarMenuBySlug(slug: string): Promise<SidebarMenuRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sidebar_menus")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function upsertSidebarMenu(payload: Record<string, unknown>): Promise<SidebarMenuRecord> {
  const supabase = createAdminClient();
  const id = payload.id as string | undefined;

  if (id) {
    const { data, error } = await supabase.from("sidebar_menus").update(payload).eq("id", id).select("*").single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  }

  const { data, error } = await supabase.from("sidebar_menus").insert(payload).select("*").single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function countSidebarMenus(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("sidebar_menus")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null);
    if (error) {
      if (isMissingSchemaError(error)) return 0;
      throw error;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}
