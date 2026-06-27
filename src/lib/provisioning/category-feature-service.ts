import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { listAllSidebarMenus } from "@/repositories/sidebar/sidebar-menus";
import { listErpFeatures } from "@/lib/platform/erp-feature-service";
import type { SidebarMenuRecord } from "@/lib/sidebar/types";
import { ALWAYS_VISIBLE_SLUGS } from "@/lib/sidebar/menu-seed-data";
import type { CategoryFeatureAssignment, FeatureTreeNode } from "@/types/category-features";

export type { FeatureTreeNode, CategoryFeatureAssignment };

export async function buildFeatureTree(activeOnly = true): Promise<FeatureTreeNode[]> {
  const menus = activeOnly ? await listErpFeatures(false) : await listErpFeatures(true);
  if (menus.length) return buildTreeFromMenus(menus, null);
  const fallback = await listAllSidebarMenus();
  return buildTreeFromMenus(fallback, null);
}

/** Menus + submenus available for category assignment (enabled in feature master) */
export async function buildAssignmentFeatureTree(): Promise<FeatureTreeNode[]> {
  const menus = await listErpFeatures(false);
  const assignable = menus.filter((m) => m.isActive && m.isVisible);
  return buildTreeFromMenus(assignable, null);
}

export type FeaturePreviewItem = { name: string; icon: string | null; slug: string };

/** Assigned feature/submenu preview per business category (for onboarding cards) */
export async function getAssignedFeaturePreviewsByCategory(): Promise<
  Record<string, FeaturePreviewItem[]>
> {
  const menus = await listErpFeatures(false);
  const supabase = createAdminClient();
  const { data: types } = await supabase
    .from("business_types")
    .select("id")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order");

  const previews: Record<string, FeaturePreviewItem[]> = {};

  for (const row of types ?? []) {
    const typeId = (row as { id: string }).id;
    const enabledIds = await getEnabledMenuIdsForCategory(typeId);
    if (!enabledIds.size) {
      previews[typeId] = menus
        .filter((m) => m.parentId === null)
        .slice(0, 8)
        .map((m) => ({ name: m.name, icon: m.icon, slug: m.slug }));
      continue;
    }

    const assigned = menus.filter((m) => enabledIds.has(m.id));
    const submenus = assigned.filter((m) => m.parentId !== null);
    const source = submenus.length > 0 ? submenus : assigned.filter((m) => m.parentId === null);

    previews[typeId] = source
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 10)
      .map((m) => ({ name: m.name, icon: m.icon, slug: m.slug }));
  }

  return previews;
}

function buildTreeFromMenus(menus: SidebarMenuRecord[], parentId: string | null): FeatureTreeNode[] {
  return menus
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
      children: buildTreeFromMenus(menus, m.id),
    }));
}

export async function getCategoryAssignments(businessTypeId: string): Promise<CategoryFeatureAssignment[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("business_category_menu_assignments")
      .select("menu_id, is_enabled, sidebar_menus(slug)")
      .eq("business_type_id", businessTypeId);

    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }

    return (data ?? []).map((row) => {
      const menu = row.sidebar_menus as { slug: string } | { slug: string }[] | null;
      const slug = Array.isArray(menu) ? menu[0]?.slug : menu?.slug;
      return {
        menuId: (row as { menu_id: string }).menu_id,
        menuSlug: slug ?? "",
        isEnabled: (row as { is_enabled: boolean }).is_enabled,
      };
    });
  } catch {
    return [];
  }
}

export async function getEnabledMenuIdsForCategory(businessTypeId: string): Promise<Set<string>> {
  const assignments = await getCategoryAssignments(businessTypeId);
  if (!assignments.length) return new Set();

  const enabled = new Set(
    assignments.filter((a) => a.isEnabled).map((a) => a.menuId)
  );
  const menus = await listAllSidebarMenus();
  return expandWithAncestors(menus, enabled);
}

export function expandWithAncestors(menus: SidebarMenuRecord[], enabledIds: Set<string>): Set<string> {
  const byId = new Map(menus.map((m) => [m.id, m]));
  const result = new Set(enabledIds);

  for (const id of enabledIds) {
    let current = byId.get(id);
    while (current?.parentId) {
      result.add(current.parentId);
      current = byId.get(current.parentId);
    }
  }
  return result;
}

export function filterMenusByAssignment(
  menus: SidebarMenuRecord[],
  allowedMenuIds: Set<string> | null,
  alwaysVisibleSlugs?: Set<string>
): SidebarMenuRecord[] {
  if (!allowedMenuIds || allowedMenuIds.size === 0) return menus;

  const visibleSlugs = alwaysVisibleSlugs ?? ALWAYS_VISIBLE_SLUGS;
  const allowedSlugs = new Set<string>();
  for (const menu of menus) {
    if (allowedMenuIds.has(menu.id) || menu.isAlwaysVisible || visibleSlugs.has(menu.slug)) {
      allowedSlugs.add(menu.slug);
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const menu of menus) {
      if (allowedSlugs.has(menu.slug)) continue;
      if (menu.parentId) {
        const parent = menus.find((m) => m.id === menu.parentId);
        if (parent && allowedSlugs.has(parent.slug)) {
          allowedSlugs.add(menu.slug);
          changed = true;
        }
      }
    }
  }

  return menus.filter(
    (m) => allowedSlugs.has(m.slug) || m.isAlwaysVisible || visibleSlugs.has(m.slug)
  );
}

export async function replaceCategoryAssignments(
  businessTypeId: string,
  assignments: { menuId: string; isEnabled: boolean }[],
  actorUserId: string | null
) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { error: deleteErr } = await supabase
    .from("business_category_menu_assignments")
    .delete()
    .eq("business_type_id", businessTypeId);

  if (deleteErr) throw deleteErr;

  const rows = assignments
    .filter((a) => a.isEnabled)
    .map((a) => ({
      business_type_id: businessTypeId,
      menu_id: a.menuId,
      is_enabled: true,
      updated_at: now,
    }));

  if (rows.length) {
    const { error: insertErr } = await supabase.from("business_category_menu_assignments").insert(rows);
    if (insertErr) throw insertErr;
  }

  await supabase.from("business_category_assignment_audit_logs").insert({
    business_type_id: businessTypeId,
    actor_user_id: actorUserId,
    action: "replace_assignments",
    payload: { count: rows.length, menuIds: rows.map((r) => r.menu_id) },
  });
}

export async function resolveTenantBusinessCategoryId(tenantId: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("tenant_business_profiles")
    .select("business_type_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (profile?.business_type_id) return profile.business_type_id as string;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("business_type")
    .eq("id", tenantId)
    .maybeSingle();

  const legacy = (tenant as { business_type?: string } | null)?.business_type;
  if (!legacy) return null;

  const { data: typeRow } = await supabase
    .from("business_types")
    .select("id")
    .or(`legacy_key.eq.${legacy},slug.eq.${legacy.toLowerCase()}`)
    .maybeSingle();

  return (typeRow as { id?: string } | null)?.id ?? null;
}

/** Root menu slug → ERP module key for dashboard gating */
const ROOT_SLUG_TO_MODULE: Record<string, string> = {
  hr: "HR",
  finance: "Finance",
  sales: "Sales",
  marketing: "Marketing",
  projects: "Projects",
  operations: "Operations",
  setup: "organisation",
  dashboard: "organisation",
  account: "organisation",
  reports: "organisation",
  administration: "organisation",
};

export async function getAssignedModuleKeysForTenant(tenantId: string): Promise<Set<string> | null> {
  const categoryId = await resolveTenantBusinessCategoryId(tenantId);
  if (!categoryId) return null;

  const enabledIds = await getEnabledMenuIdsForCategory(categoryId);
  if (!enabledIds.size) return null;

  const menus = await listAllSidebarMenus();
  const rootSlugs = new Set(
    menus.filter((m) => m.parentId === null).map((m) => m.slug)
  );

  const modules = new Set<string>();
  for (const menu of menus) {
    if (!enabledIds.has(menu.id)) continue;
    if (menu.moduleKey) {
      modules.add(menu.moduleKey);
      continue;
    }
    let current: SidebarMenuRecord | undefined = menu;
    while (current?.parentId) {
      current = menus.find((m) => m.id === current!.parentId);
    }
    if (current && rootSlugs.has(current.slug)) {
      const mod = ROOT_SLUG_TO_MODULE[current.slug];
      if (mod) modules.add(mod);
    }
  }
  return modules;
}
