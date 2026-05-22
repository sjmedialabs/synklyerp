"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";

export function useOrganizationModules() {
  return useQuery({
    queryKey: ["tenant", "modules"],
    queryFn: () => fetchApi<{ modules: string[] }>("/api/tenant/modules"),
    staleTime: 120_000,
  });
}
