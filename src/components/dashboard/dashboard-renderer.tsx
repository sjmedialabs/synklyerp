"use client";

import { Loader2 } from "lucide-react";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { KpiWidget } from "@/components/dashboard/kpi-widget";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import type { ResolvedDashboard } from "@/lib/dashboard/resolve-widgets";

type DashboardRendererProps = {
  config: ResolvedDashboard | null;
  enabledModuleCount?: number;
  loading?: boolean;
  error?: boolean;
};

export function DashboardRenderer({
  config,
  enabledModuleCount = 0,
  loading,
  error,
}: DashboardRendererProps) {
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <p className="rounded-xl border border-dashed border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
        Could not load dashboard configuration. Please refresh or contact your administrator.
      </p>
    );
  }

  const showWelcome = config.panels.some((p) => p.type === "welcome");
  const showActivity = config.panels.some((p) => p.type === "activity");
  const showShortcuts = config.panels.some((p) => p.type === "quick_actions");

  return (
    <div className="space-y-6">
      {showWelcome && (
        <WelcomeBanner
          tenantName={config.tenantName ?? "Your workspace"}
          businessType={config.businessType ?? ""}
          industrySubtype={config.industrySubtype ?? ""}
          kpiCount={config.kpis.length}
          moduleCount={enabledModuleCount}
        />
      )}

      {config.kpis.length > 0 ? (
        <div
          className={`grid gap-4 sm:grid-cols-2 ${
            config.kpis.length >= 4 ? "lg:grid-cols-4" : config.kpis.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
          }`}
        >
          {config.kpis.map((widget) => (
            <KpiWidget key={widget.id} widget={widget} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50">
          No metrics available for your current permissions.
        </p>
      )}

      {(showActivity || showShortcuts) && (
        <div className="grid gap-6 lg:grid-cols-3">
          {showActivity && (
            <div className={showShortcuts ? "lg:col-span-2" : "lg:col-span-3"}>
              <ActivityPanel />
            </div>
          )}
          {showShortcuts && (
            <div>
              <QuickActionsPanel shortcuts={config.shortcuts ?? []} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
