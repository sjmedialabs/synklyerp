import { listAllSidebarMenus } from "@/repositories/sidebar/sidebar-menus";
import { getEnabledMenuIdsForCategory } from "@/lib/provisioning/category-feature-service";
import { listErpFeatures } from "@/lib/platform/erp-feature-service";
import type { SidebarMenuRecord } from "@/lib/sidebar/types";

export type FeatureLink = {
  code: string;
  name: string;
  path: string | null;
};

function firstDescendantPath(menus: SidebarMenuRecord[], parentId: string): string | null {
  const children = menus
    .filter((m) => m.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const child of children) {
    if (child.path) return child.path;
    const nested = firstDescendantPath(menus, child.id);
    if (nested) return nested;
  }
  return null;
}

function resolveModulePath(menus: SidebarMenuRecord[], moduleCode: string): string | null {
  const section = menus.find(
    (m) => m.moduleKey === moduleCode && (m.menuType === "section" || m.parentId === null)
  );
  if (!section) {
    return menus.find((m) => m.moduleKey === moduleCode && m.path)?.path ?? null;
  }
  if (section.path) return section.path;
  return firstDescendantPath(menus, section.id);
}

function resolveCapabilityLink(menus: SidebarMenuRecord[], code: string): FeatureLink {
  const menu =
    menus
      .filter((m) => m.path && m.requiredSubmodules.includes(code))
      .sort((a, b) => a.sortOrder - b.sortOrder)[0] ??
    menus.find((m) => m.path && m.slug === code.replace(/_/g, "-"));

  return {
    code,
    name: menu?.name ?? code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    path: menu?.path ?? null,
  };
}

export async function resolveFeatureLinks(
  enabledModules: string[],
  enabledSubmodules: string[]
): Promise<{ moduleLinks: FeatureLink[]; capabilityLinks: FeatureLink[] }> {
  const menus = await listAllSidebarMenus();

  const moduleLinks: FeatureLink[] = enabledModules.map((code) => {
    const section = menus.find((m) => m.moduleKey === code && m.menuType === "section");
    return {
      code,
      name: section?.name ?? code,
      path: resolveModulePath(menus, code),
    };
  });

  const capabilityLinks: FeatureLink[] = enabledSubmodules.map((code) =>
    resolveCapabilityLink(menus, code)
  );

  return { moduleLinks, capabilityLinks };
}

/** ERP module links assigned to a business category in super admin */
export async function resolveBusinessTypeModuleLinks(businessTypeId: string): Promise<FeatureLink[]> {
  const enabledMenuIds = await getEnabledMenuIdsForCategory(businessTypeId);
  let menus = await listErpFeatures(false);
  if (!menus.length) menus = await listAllSidebarMenus();

  const assigned = menus.filter((m) => enabledMenuIds.has(m.id) && m.isActive && m.isVisible);
  const moduleKeys = [
    ...new Set(assigned.map((m) => m.moduleKey).filter(Boolean) as string[]),
  ];

  if (!moduleKeys.length) return [];
  return resolveFeatureLinks(moduleKeys, []).then((r) => r.moduleLinks);
}
