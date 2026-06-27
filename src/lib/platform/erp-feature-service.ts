import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { SidebarMenuRecord } from "@/lib/sidebar/types";
import type { ErpFeatureInput } from "@/validators/platform-features";
import type { FeatureTreeNode } from "@/types/category-features";

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

function toSnake(input: ErpFeatureInput): Record<string, unknown> {
  return {
    parent_id: input.parentId ?? null,
    name: input.name,
    slug: input.slug,
    path: input.path ?? null,
    icon: input.icon ?? null,
    module_key: input.moduleKey ?? null,
    menu_type: input.menuType,
    permission_module: input.permissionModule ?? null,
    permission_feature: input.permissionFeature ?? null,
    permission_action: input.permissionAction,
    sort_order: input.sortOrder,
    is_visible: input.isVisible,
    is_active: input.isActive,
    is_system: input.isSystem,
    is_always_visible: input.isAlwaysVisible,
    level: input.level ?? 0,
    required_plan: input.requiredPlan ?? null,
    required_business_types: input.requiredBusinessTypes,
    hidden_for_business_types: input.hiddenForBusinessTypes,
    required_submodules: input.requiredSubmodules,
    feature_flag_key: input.featureFlagKey ?? null,
    badge: input.badge ?? null,
    status: input.status,
  };
}

export function computeLevel(parentId: string | null, menus: SidebarMenuRecord[]): number {
  if (!parentId) return 0;
  const parent = menus.find((m) => m.id === parentId);
  if (!parent) return 0;
  return (parent.level ?? 0) + 1;
}

export function buildFeatureTreeFromRecords(menus: SidebarMenuRecord[]): FeatureTreeNode[] {
  const walk = (parentId: string | null): FeatureTreeNode[] =>
    menus
      .filter((m) => m.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        icon: m.icon,
        menuType: m.menuType,
        moduleKey: m.moduleKey,
        parentId: m.parentId,
        sortOrder: m.sortOrder,
        children: walk(m.id),
      }));
  return walk(null);
}

export async function listErpFeatures(includeInactive = true): Promise<SidebarMenuRecord[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("sidebar_menus")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order")
      .order("name");

    if (!includeInactive) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getErpFeatureById(id: string): Promise<SidebarMenuRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("sidebar_menus").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function createErpFeature(input: ErpFeatureInput, actorUserId: string | null) {
  const supabase = createAdminClient();
  const all = await listErpFeatures();
  const level = input.level ?? computeLevel(input.parentId ?? null, all);
  const payload = { ...toSnake(input), level };

  const { data, error } = await supabase.from("sidebar_menus").insert(payload).select("*").single();
  if (error) throw error;

  await logAudit((data as { id: string }).id, actorUserId, "create", { slug: input.slug });
  return mapRow(data as Record<string, unknown>);
}

export async function updateErpFeature(id: string, input: ErpFeatureInput, actorUserId: string | null) {
  const supabase = createAdminClient();
  const all = await listErpFeatures();
  const level = input.level ?? computeLevel(input.parentId ?? null, all);
  const payload = { ...toSnake(input), level };

  const { data, error } = await supabase.from("sidebar_menus").update(payload).eq("id", id).select("*").single();
  if (error) throw error;

  await logAudit(id, actorUserId, "update", { slug: input.slug });
  return mapRow(data as Record<string, unknown>);
}

export async function deleteErpFeature(id: string, actorUserId: string | null) {
  const supabase = createAdminClient();
  const existing = await getErpFeatureById(id);
  if (!existing) return;
  if (existing.isSystem) throw new Error("System features cannot be deleted");

  const { error } = await supabase
    .from("sidebar_menus")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) throw error;

  await logAudit(id, actorUserId, "delete", { slug: existing.slug });
}

export async function reorderErpFeatures(
  items: { id: string; parentId: string | null; sortOrder: number; level?: number }[],
  actorUserId: string | null
) {
  const supabase = createAdminClient();
  for (const item of items) {
    const { error } = await supabase
      .from("sidebar_menus")
      .update({
        parent_id: item.parentId,
        sort_order: item.sortOrder,
        level: item.level ?? 0,
      })
      .eq("id", item.id);
    if (error) throw error;
  }
  await logAudit(null, actorUserId, "reorder", { count: items.length });
}

async function logAudit(
  menuId: string | null,
  actorUserId: string | null,
  action: string,
  payload: Record<string, unknown>
) {
  try {
    const supabase = createAdminClient();
    await supabase.from("erp_feature_audit_logs").insert({
      menu_id: menuId,
      actor_user_id: actorUserId,
      action,
      payload,
    });
  } catch {
    /* audit table optional until migration 017 */
  }
}

export async function getAlwaysVisibleSlugsFromDb(): Promise<Set<string>> {
  const menus = await listErpFeatures(false);
  const slugs = new Set(menus.filter((m) => m.isAlwaysVisible).map((m) => m.slug));
  return slugs.size > 0 ? slugs : new Set(["dashboard", "setup", "account"]);
}

export async function getOrganizationMenuOverrides(tenantId: string): Promise<Map<string, "enable" | "disable">> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("organization_menu_overrides")
      .select("menu_id, override_type")
      .eq("tenant_id", tenantId);

    if (error) {
      if (isMissingSchemaError(error)) return new Map();
      throw error;
    }

    const map = new Map<string, "enable" | "disable">();
    for (const row of data ?? []) {
      map.set(
        (row as { menu_id: string }).menu_id,
        (row as { override_type: "enable" | "disable" }).override_type
      );
    }
    return map;
  } catch {
    return new Map();
  }
}
