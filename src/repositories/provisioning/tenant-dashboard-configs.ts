import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { DashboardWidgetConfig } from "@/business-configs/types";

export async function replaceTenantDashboardConfigs(tenantId: string, widgets: DashboardWidgetConfig[]) {
  const supabase = createAdminClient();
  const { error: delErr } = await supabase.from("tenant_dashboard_configs").delete().eq("tenant_id", tenantId);
  if (delErr && !isMissingSchemaError(delErr)) throw delErr;
  if (isMissingSchemaError(delErr)) return;

  if (!widgets.length) return;

  const now = new Date().toISOString();
  const payload = widgets.map((w) => ({
    tenant_id: tenantId,
    widget_code: w.widgetCode,
    position: { order: w.order, column: w.column, span: w.span },
    visible: w.visible,
    config: {},
    updated_at: now,
  }));

  const { error } = await supabase.from("tenant_dashboard_configs").insert(payload);
  if (error) throw error;
}

export async function listTenantDashboardConfigs(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenant_dashboard_configs")
    .select("widget_code, position, visible, config")
    .eq("tenant_id", tenantId)
    .eq("visible", true)
    .order("created_at");

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => {
    const r = row as { widget_code: string; position: { order?: number }; visible: boolean; config: unknown };
    return {
      widgetCode: r.widget_code,
      order: r.position?.order ?? 0,
      visible: r.visible,
      config: r.config,
    };
  });
}
