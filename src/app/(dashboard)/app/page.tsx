"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DashboardRenderer } from "@/components/dashboard/dashboard-renderer";
import { useDashboardConfig } from "@/hooks/dashboard/use-dashboard-config";
import { useSession } from "next-auth/react";

export default function AppDashboardPage() {
  const { data: session } = useSession();
  const { data: config, isLoading, isError } = useDashboardConfig();

  const enabledModuleCount = session?.user?.enabledModules?.length ?? 0;

  return (
    <div>
      <PageHeader
        title="Workspace Dashboard"
        description="Personalised overview based on your role, permissions, and enabled modules."
      />

      <DashboardRenderer
        config={config ?? null}
        enabledModuleCount={enabledModuleCount}
        loading={isLoading}
        error={isError}
      />
    </div>
  );
}
