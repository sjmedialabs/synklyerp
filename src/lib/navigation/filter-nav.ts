import { APP_NAVIGATION, type NavItem } from "@/config/navigation";
import { NAV_ID_TO_MODULE } from "@/constants/onboarding";

const ALWAYS_VISIBLE = new Set(["dashboard", "setup", "account"]);
const SETUP_ALWAYS_VISIBLE = new Set([
  "business-type",
  "organisation-hub",
  "company-info",
  "branch-mgmt",
]);

function filterItem(
  item: NavItem,
  enabledModules: Set<string>,
  canAccessNav?: (navId: string) => boolean,
  enabledSubmodules?: Set<string> | null
): NavItem | null {
  const moduleKey = NAV_ID_TO_MODULE[item.id];
  if (moduleKey && !enabledModules.has(moduleKey)) {
    return null;
  }
  if (!submoduleAllowsNav(item.id, enabledSubmodules ?? null)) {
    return null;
  }
  if (canAccessNav && !ALWAYS_VISIBLE.has(item.id) && !canAccessNav(item.id)) {
    return null;
  }

  if (item.children?.length) {
    const children = item.children
      .map((child) => filterItem(child, enabledModules, canAccessNav, enabledSubmodules))
      .filter((c): c is NavItem => c !== null);
    if (!item.href && children.length === 0) return null;
    return { ...item, children };
  }

  return item;
}

export function filterNavigation(
  enabledModules: string[],
  canAccessNav?: (navId: string) => boolean,
  enabledSubmodules?: string[]
): NavItem[] {
  const enabled = new Set(enabledModules);
  const submoduleSet = enabledSubmodules?.length ? new Set(enabledSubmodules) : null;
  return APP_NAVIGATION.map((item) => {
    if (item.id === "setup") {
      const children = item.children
        ?.map((child) => {
          if (SETUP_ALWAYS_VISIBLE.has(child.id)) return child;
          return filterItem(child, enabled, canAccessNav, submoduleSet);
        })
        .filter((c): c is NavItem => c !== null);
      return children?.length ? { ...item, children } : null;
    }
    if (ALWAYS_VISIBLE.has(item.id)) return item;
    return filterItem(item, enabled, canAccessNav, submoduleSet);
  }).filter((item): item is NavItem => item !== null);
}

function submoduleAllowsNav(navId: string, submoduleSet: Set<string> | null) {
  if (!submoduleSet) return true;
  const navSubmoduleRequirements: Record<string, string[]> = {
    operations: ["inventory_management", "warehouse_management", "procurement"],
    projects: ["project_management", "task_tracking", "time_tracking"],
    sales: ["crm", "sales_orders"],
    marketing: ["marketing_campaigns"],
  };
  const required = navSubmoduleRequirements[navId];
  if (!required?.length) return true;
  return required.some((code) => submoduleSet.has(code));
}
