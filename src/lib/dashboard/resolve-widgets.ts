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
  tenantName?: string | null;
};

export type ResolvedDashboard = {
  kpis: DashboardWidgetDef[];
  panels: DashboardWidgetDef[];
  shortcuts: DashboardShortcutDef[];
  businessType: string;
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

function moduleEnabled(enabled: Set<string>, moduleKey?: string) {
  if (!moduleKey || moduleKey === "organisation") return true;
  return enabled.has(moduleKey);
}

function roleAllowed(role: AppRole, roles?: AppRole[]) {
  if (!roles?.length) return true;
  if (role === "ADMIN" || role === "SUPERADMIN") return true;
  return roles.includes(role);
}

function businessBoost(businessType: string, widget: DashboardWidgetDef) {
  if (!widget.businessTypes?.length) return 0;
  return widget.businessTypes.includes(businessType as BusinessType) ? -5 : 0;
}

function filterWidget(
  widget: DashboardWidgetDef,
  input: ResolveDashboardInput,
  permSet: Set<string>,
  enabled: Set<string>
) {
  if (!roleAllowed(input.role, widget.roles)) return false;
  if (!moduleEnabled(enabled, widget.moduleKey)) return false;
  if (!hasPermission(permSet, input.role, widget.permission)) return false;
  return true;
}

export function resolveDashboard(input: ResolveDashboardInput): ResolvedDashboard {
  const permSet = new Set(input.permissions);
  const enabled = new Set(input.enabledModules);

  const kpis = DASHBOARD_KPI_WIDGETS.filter((w) => filterWidget(w, input, permSet, enabled)).sort(
    (a, b) => a.priority + businessBoost(input.businessType, a) - (b.priority + businessBoost(input.businessType, b))
  );

  const panels = DASHBOARD_PANEL_WIDGETS.filter((w) => {
    if (w.type === "activity") return permSet.size > 0 || input.role === "ADMIN";
    if (w.type === "quick_actions") return true;
    if (w.type === "welcome") return true;
    return filterWidget(w, input, permSet, enabled);
  }).sort((a, b) => a.priority - b.priority);

  const shortcuts = DASHBOARD_SHORTCUTS.filter((s) => {
    if (!moduleEnabled(enabled, s.moduleKey)) return false;
    return hasPermission(permSet, input.role, s.permission);
  }).sort((a, b) => a.priority - b.priority);

  return {
    kpis,
    panels,
    shortcuts,
    businessType: input.businessType,
    tenantName: input.tenantName ?? null,
  };
}
