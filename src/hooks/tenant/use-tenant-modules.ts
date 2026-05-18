"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api/client";

export function useTenantModules() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["tenant", "modules"],
    queryFn: async () => {
      const data = await fetchApi<{ modules: string[] }>("/api/tenant/modules");
      return data.modules;
    },
    enabled: !!session?.user?.tenantId,
    staleTime: 60_000,
  });
}
