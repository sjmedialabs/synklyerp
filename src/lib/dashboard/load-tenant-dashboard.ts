import { resolveDashboard } from "@/lib/dashboard/resolve-widgets";
import { listTenantDashboardConfigs } from "@/repositories/provisioning/tenant-dashboard-configs";
import type { ResolveDashboardInput, ResolvedDashboard } from "@/lib/dashboard/resolve-widgets";

export async function loadTenantDashboardConfig(
  input: ResolveDashboardInput,
  tenantId: string
): Promise<ResolvedDashboard & { widgetLayout: Awaited<ReturnType<typeof listTenantDashboardConfigs>> }> {
  const widgetLayout = await listTenantDashboardConfigs(tenantId);
  const resolved = resolveDashboard(input);

  if (!widgetLayout.length) {
    return { ...resolved, widgetLayout };
  }

  const allowedWidgetCodes = new Set(widgetLayout.map((w) => w.widgetCode));
  const order = new Map(widgetLayout.map((w) => [w.widgetCode, w.order]));

  return {
    ...resolved,
    kpis: resolved.kpis
      .filter((kpi) => allowedWidgetCodes.has(kpi.id))
      .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)),
    panels: resolved.panels
      .filter((panel) => allowedWidgetCodes.has(panel.id))
      .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)),
    widgetLayout,
  };
}
