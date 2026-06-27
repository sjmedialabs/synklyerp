"use client";

import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiWidget } from "@/components/dashboard/kpi-widget";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { useDashboardConfig } from "@/hooks/dashboard/use-dashboard-config";
import { useSession } from "next-auth/react";

export default function AppDashboardPage() {
  const { data: session } = useSession();
  const { data: config, isLoading, isError } = useDashboardConfig();

  const enabledModuleCount = session?.user?.enabledModules?.length ?? 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div>
        <PageHeader title="Workspace Dashboard" description="Could not load dashboard configuration." />
        <p className="text-sm text-red-600">Please refresh the page or contact your administrator.</p>
      </div>
    );
  }

  const showWelcome = config.panels.some((p) => p.type === "welcome");
  const showActivity = config.panels.some((p) => p.type === "activity");
  const showShortcuts = config.panels.some((p) => p.type === "quick_actions");

  return (
    <div>
      <PageHeader
        title="Workspace Dashboard"
        description="Personalised overview based on your role, permissions, and enabled modules."
      />

      {showWelcome && (
        <div className="mb-6">
          <WelcomeBanner
            tenantName={config.tenantName}
            businessType={config.businessType}
            industrySubtype={config.industrySubtype}
            kpiCount={config.kpis.length}
            moduleCount={enabledModuleCount}
          />
        </div>
      )}

      {config.kpis.length > 0 ? (
        <div
          className={`mb-8 grid gap-4 sm:grid-cols-2 ${
            config.kpis.length >= 4 ? "lg:grid-cols-4" : config.kpis.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
          }`}
        >
          {config.kpis.map((widget) => (
            <KpiWidget key={widget.id} widget={widget} />
          ))}
        </div>
      ) : (
        <p className="mb-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50">
          No metrics available for your current permissions. Contact your admin to request access.
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
            <div className={showActivity ? "" : "lg:col-span-3"}>
              <QuickActionsPanel shortcuts={config.shortcuts} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
