import { permissionKey } from "@/constants/permissions";
import type { BusinessType } from "@/constants/onboarding";
import {
  DASHBOARD_KPI_WIDGETS,
  DASHBOARD_PANEL_WIDGETS,
  DASHBOARD_SHORTCUTS,
  type DashboardShortcutDef,
  type DashboardWidgetDef,
} from "@/config/dashboard-widgets";
import type { AppRole } from "@/types/auth";

export type ResolveDashboardInput = {
  enabledModules: string[];
  permissions: string[];
  role: AppRole;
  businessType: string;
  industrySubtype?: string | null;
  tenantName?: string | null;
  /** When set, widgets are gated by business category feature assignments */
  assignedModuleKeys?: Set<string> | null;
};

export type ResolvedDashboard = {
  kpis: DashboardWidgetDef[];
  panels: DashboardWidgetDef[];
  shortcuts: DashboardShortcutDef[];
  businessType: string;
  industrySubtype: string | null;
  tenantName: string | null;
};

function hasPermission(
  permissions: Set<string>,
  role: AppRole,
  check?: { module: string; feature: string; action?: string }
) {
  if (!check) return true;
  if (role === "ADMIN" || role === "SUPERADMIN") return true;
  const action = check.action ?? "read";
  return permissions.has(permissionKey(check.module, check.feature, action));
}

function moduleEnabled(enabled: Set<string>, moduleKey?: string, assigned?: Set<string> | null) {
  if (assigned && assigned.size > 0 && moduleKey) {
    if (!assigned.has(moduleKey)) return false;
  }
  if (!moduleKey || moduleKey === "organisation") return true;
  return enabled.has(moduleKey);
}

function roleAllowed(role: AppRole, roles?: AppRole[]) {
  if (!roles?.length) return true;
  if (role === "ADMIN" || role === "SUPERADMIN") return true;
  return roles.includes(role);
}

function personalizationBoost(
  businessType: string,
  industrySubtype: string | null | undefined,
  item: { businessTypes?: BusinessType[]; industrySubtypes?: string[]; priority: number }
) {
  let score = item.priority;
  if (item.businessTypes?.length && item.businessTypes.includes(businessType as BusinessType)) {
    score -= 5;
  }
  if (industrySubtype && item.industrySubtypes?.includes(industrySubtype)) {
    score -= 8;
  }
  return score;
}

function filterWidget(
  widget: DashboardWidgetDef,
  input: ResolveDashboardInput,
  permSet: Set<string>,
  enabled: Set<string>
) {
  if (!roleAllowed(input.role, widget.roles)) return false;
  if (!moduleEnabled(enabled, widget.moduleKey, input.assignedModuleKeys)) return false;
  if (!hasPermission(permSet, input.role, widget.permission)) return false;
  return true;
}

export function resolveDashboard(input: ResolveDashboardInput): ResolvedDashboard {
  const permSet = new Set(input.permissions);
  const enabled = new Set(input.enabledModules);
  const assigned = input.assignedModuleKeys;
  const industrySubtype = input.industrySubtype ?? null;

  const kpis = DASHBOARD_KPI_WIDGETS.filter((w) => filterWidget(w, input, permSet, enabled)).sort(
    (a, b) =>
      personalizationBoost(input.businessType, industrySubtype, a) -
      personalizationBoost(input.businessType, industrySubtype, b)
  );

  const panels = DASHBOARD_PANEL_WIDGETS.filter((w) => {
    if (w.type === "activity") return permSet.size > 0 || input.role === "ADMIN";
    if (w.type === "quick_actions") return true;
    if (w.type === "welcome") return true;
    return filterWidget(w, input, permSet, enabled);
  }).sort((a, b) => a.priority - b.priority);

  const shortcuts = DASHBOARD_SHORTCUTS.filter((s) => {
    if (!moduleEnabled(enabled, s.moduleKey, assigned)) return false;
    if (!hasPermission(permSet, input.role, s.permission)) return false;
    if (s.businessTypes?.length && !s.businessTypes.includes(input.businessType as BusinessType)) {
      return false;
    }
    if (s.industrySubtypes?.length && industrySubtype && !s.industrySubtypes.includes(industrySubtype)) {
      return false;
    }
    return true;
  }).sort(
    (a, b) =>
      personalizationBoost(input.businessType, industrySubtype, a) -
      personalizationBoost(input.businessType, industrySubtype, b)
  );

  return {
    kpis,
    panels,
    shortcuts,
    businessType: input.businessType,
    industrySubtype,
    tenantName: input.tenantName ?? null,
  };
}
