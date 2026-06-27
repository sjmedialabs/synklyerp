import { permissionKey } from "@/constants/permissions";
import { ALWAYS_VISIBLE_SLUGS, PLAN_RANK } from "@/lib/sidebar/menu-seed-data";
import { iconKeyForNavItem } from "@/lib/sidebar/nav-item-icons";
import type {
  RenderedSidebarMenu,
  RenderedSidebarSection,
  SidebarMenuRecord,
  SidebarRenderContext,
} from "@/lib/sidebar/types";

function normalizeBusinessTypeSlug(businessType: string | null): string | null {
  if (!businessType) return null;
  const map: Record<string, string> = {
    Product: "product",
    Service: "service",
    Hybrid: "hybrid",
  };
  return map[businessType] ?? businessType.toLowerCase();
}

function planMeetsRequirement(userPlan: string | null, requiredPlan: string | null): boolean {
  if (!requiredPlan) return true;
  const userRank = PLAN_RANK[userPlan?.toLowerCase() ?? "starter"] ?? 1;
  const requiredRank = PLAN_RANK[requiredPlan.toLowerCase()] ?? 99;
  return userRank >= requiredRank;
}

function hasPermission(ctx: SidebarRenderContext, menu: SidebarMenuRecord): boolean {
  if (ctx.isAdmin) return true;
  if (!menu.permissionModule || !menu.permissionFeature) return true;
  return ctx.permissions.includes(
    permissionKey(menu.permissionModule, menu.permissionFeature, menu.permissionAction as "read")
  );
}

function isAlwaysVisibleSlug(ctx: SidebarRenderContext, menu: SidebarMenuRecord): boolean {
  if (menu.isAlwaysVisible) return true;
  if (ctx.alwaysVisibleSlugs?.has(menu.slug)) return true;
  return ALWAYS_VISIBLE_SLUGS.has(menu.slug);
}

function orgOverrideBlocks(ctx: SidebarRenderContext, menu: SidebarMenuRecord): boolean {
  const override = ctx.orgMenuOverrides?.get(menu.id);
  return override === "disable";
}

function moduleAllowed(ctx: SidebarRenderContext, menu: SidebarMenuRecord): boolean {
  if (isAlwaysVisibleSlug(ctx, menu)) return true;
  if (menu.slug === "setup" || menu.parentId === null && menu.menuType === "section" && menu.slug === "account") {
    return true;
  }
  if (!menu.moduleKey) return true;
  return ctx.enabledModules.includes(menu.moduleKey);
}

function businessTypeAllowed(ctx: SidebarRenderContext, menu: SidebarMenuRecord): boolean {
  const typeSlug = normalizeBusinessTypeSlug(ctx.businessTypeSlug ?? ctx.businessType);
  if (typeSlug && menu.hiddenForBusinessTypes.length > 0) {
    if (menu.hiddenForBusinessTypes.some((t) => t.toLowerCase() === typeSlug)) return false;
  }
  if (menu.requiredBusinessTypes.length > 0 && typeSlug) {
    return menu.requiredBusinessTypes.some((t) => t.toLowerCase() === typeSlug);
  }
  return true;
}

function submoduleAllowed(ctx: SidebarRenderContext, menu: SidebarMenuRecord): boolean {
  if (!menu.requiredSubmodules.length) return true;
  if (!ctx.enabledSubmodules.length) return true;
  return menu.requiredSubmodules.some((code) => ctx.enabledSubmodules.includes(code));
}

function featureFlagAllowed(ctx: SidebarRenderContext, menu: SidebarMenuRecord): boolean {
  if (!menu.featureFlagKey) return true;
  if (ctx.isAdmin) return true;
  return ctx.featureFlags.has(menu.featureFlagKey);
}

function isMenuVisible(ctx: SidebarRenderContext, menu: SidebarMenuRecord): boolean {
  if (!menu.isVisible || !menu.isActive) return false;
  if (ctx.hiddenMenuSlugs.has(menu.slug)) return false;
  if (orgOverrideBlocks(ctx, menu)) return false;
  if (isAlwaysVisibleSlug(ctx, menu)) return true;

  if (!planMeetsRequirement(ctx.planSlug, menu.requiredPlan)) return false;
  if (!moduleAllowed(ctx, menu)) return false;
  if (!businessTypeAllowed(ctx, menu)) return false;
  if (!submoduleAllowed(ctx, menu)) return false;
  if (!featureFlagAllowed(ctx, menu)) return false;
  if (!hasPermission(ctx, menu)) return false;

  return true;
}

function toRenderedMenu(menu: SidebarMenuRecord, children: RenderedSidebarMenu[]): RenderedSidebarMenu | null {
  const hasPath = !!menu.path;
  const hasChildren = children.length > 0;
  if (!hasPath && !hasChildren) return null;

  return {
    id: menu.id,
    slug: menu.slug,
    name: menu.name,
    icon: menu.icon ? iconKeyForNavItem(menu.slug, menu.icon) : iconKeyForNavItem(menu.slug),
    path: menu.path,
    badge: menu.badge,
    status: menu.status,
    children,
  };
}

export function buildMenuTree(
  menus: SidebarMenuRecord[],
  ctx: SidebarRenderContext,
  parentId: string | null = null
): RenderedSidebarMenu[] {
  return menus
    .filter((m) => m.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((menu) => {
      const childMenus = buildMenuTree(menus, ctx, menu.id);
      if (!isMenuVisible(ctx, menu) && !isAlwaysVisibleSlug(ctx, menu)) {
        if (menu.menuType === "section" || menu.menuType === "group") {
          return childMenus.length ? { ...toRenderedMenu(menu, childMenus)!, path: null } : null;
        }
        return null;
      }
      return toRenderedMenu(menu, childMenus);
    })
    .filter((m): m is RenderedSidebarMenu => m !== null);
}

export function buildSidebarSections(
  menus: SidebarMenuRecord[],
  ctx: SidebarRenderContext
): RenderedSidebarSection[] {
  const roots = menus
    .filter((m) => m.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const sections: RenderedSidebarSection[] = [];

  for (const root of roots) {
    if (root.menuType === "section") {
      const children = buildMenuTree(menus, ctx, root.id);
      const sectionVisible =
        isAlwaysVisibleSlug(ctx, root) ||
        isMenuVisible(ctx, root) ||
        children.length > 0;

      if (!sectionVisible) continue;

      const rootMenu =
        toRenderedMenu(root, children) ?? {
          id: root.id,
          slug: root.slug,
          name: root.name,
          icon: root.icon,
          path: root.path ?? null,
          badge: root.badge,
          status: root.status,
          children,
        };

      if (!rootMenu.path && rootMenu.children.length === 0) continue;

      sections.push({
        title: root.name,
        slug: root.slug,
        icon: root.icon,
        menus: [rootMenu],
      });
    } else {
      const item = buildMenuTree(menus, ctx, null).find((m) => m.slug === root.slug);
      if (item) {
        sections.push({
          title: root.name,
          slug: root.slug,
          icon: root.icon,
          menus: [item],
        });
      }
    }
  }

  return sections.filter((s) => s.menus.length > 0);
}

export function filterMenusByTemplate(
  menus: SidebarMenuRecord[],
  templateMenuIds: string[]
): SidebarMenuRecord[] {
  if (!templateMenuIds.length) return menus;

  const allowedIds = new Set(templateMenuIds);
  const allowedSlugs = new Set<string>();

  for (const menu of menus) {
    if (allowedIds.has(menu.id) || ALWAYS_VISIBLE_SLUGS.has(menu.slug)) {
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

  return menus.filter((m) => allowedSlugs.has(m.slug) || ALWAYS_VISIBLE_SLUGS.has(m.slug));
}
