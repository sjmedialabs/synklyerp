"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";

type TenantBusinessProfileResponse = {
  enabledSubmodules: string[];
  provisioningStatus: string;
  onboardingCompleted: boolean;
};

export function useTenantBusinessProfile() {
  return useQuery({
    queryKey: ["tenant", "business-profile"],
    queryFn: () => fetchApi<TenantBusinessProfileResponse>("/api/tenant/business-profile"),
    staleTime: 60_000,
  });
}
