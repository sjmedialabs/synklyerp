import { APP_NAVIGATION, type NavItem } from "@/config/navigation";
import { NAV_ID_TO_MODULE } from "@/constants/onboarding";

const ALWAYS_VISIBLE = new Set(["dashboard", "setup", "account"]);

function filterItem(
  item: NavItem,
  enabledModules: Set<string>,
  canAccessNav?: (navId: string) => boolean
): NavItem | null {
  const moduleKey = NAV_ID_TO_MODULE[item.id];
  if (moduleKey && !enabledModules.has(moduleKey)) {
    return null;
  }
  if (canAccessNav && !ALWAYS_VISIBLE.has(item.id) && !canAccessNav(item.id)) {
    return null;
  }

  if (item.children?.length) {
    const children = item.children
      .map((child) => filterItem(child, enabledModules, canAccessNav))
      .filter((c): c is NavItem => c !== null);
    if (!item.href && children.length === 0) return null;
    return { ...item, children };
  }

  return item;
}

export function filterNavigation(
  enabledModules: string[],
  canAccessNav?: (navId: string) => boolean
): NavItem[] {
  const enabled = new Set(enabledModules);
  return APP_NAVIGATION.map((item) => {
    if (ALWAYS_VISIBLE.has(item.id)) return item;
    return filterItem(item, enabled, canAccessNav);
  }).filter((item): item is NavItem => item !== null);
}
