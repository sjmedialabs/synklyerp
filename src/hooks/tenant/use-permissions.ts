"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { fetchApi } from "@/lib/api/client";
import { permissionKey } from "@/constants/permissions";
import { canReadModule } from "@/lib/rbac/permissions";
import { NAV_ID_TO_MODULE } from "@/constants/onboarding";

export function usePermissions() {
  const { data: session } = useSession();

  const query = useQuery({
    queryKey: ["tenant", "permissions"],
    queryFn: () => fetchApi<{ permissions: string[]; role: string }>("/api/tenant/permissions"),
    enabled: !!session?.user?.tenantId,
    staleTime: 120_000,
  });

  const permissionSet = useMemo(
    () => new Set(query.data?.permissions ?? []),
    [query.data?.permissions]
  );

  const can = useMemo(
    () => ({
      read: (module: string, feature: string) => canReadModule(permissionSet, module, feature),
      any: (module: string, feature: string, action: string) =>
        permissionSet.has(permissionKey(module, feature, action)),
    }),
    [permissionSet]
  );

  const canAccessNavId = (navId: string) => {
    const moduleKey = NAV_ID_TO_MODULE[navId];
    if (!moduleKey) return true;
    const featureMap: Record<string, string> = {
      hr: "employees",
      finance: "services",
      sales: "leads",
      marketing: "leads",
      projects: "projects",
      operations: "projects",
    };
    const feature = featureMap[navId] ?? navId;
    const module = navId === "marketing" ? "sales" : navId === "operations" ? "projects" : navId;
    return can.read(module, feature);
  };

  return { ...query, permissionSet, can, canAccessNavId, role: query.data?.role ?? session?.user?.role };
}
