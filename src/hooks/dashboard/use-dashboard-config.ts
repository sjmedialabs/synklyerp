"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api/client";
import type { ResolvedDashboard } from "@/lib/dashboard/resolve-widgets";

export function useDashboardConfig() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["dashboard", "config", session?.user?.tenantId, session?.user?.role],
    queryFn: () => fetchApi<ResolvedDashboard>("/api/dashboard/config"),
    enabled: !!session?.user?.tenantId,
    staleTime: 60_000,
  });
}
