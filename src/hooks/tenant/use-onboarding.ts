"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import type { OnboardingDraftInput } from "@/validators/onboarding";

export type OnboardingStateResponse = {
  completed: boolean;
  locked: boolean;
  completedAt: string | null;
  draft: OnboardingDraftInput | null;
  businessType: string;
  businessSubcategory: string | null;
  industrySubtype: string | null;
  employeeCount: string | null;
  businessSize: string | null;
  enabledModules: string[];
  enabledSubmodules: string[];
  previewModules: string[];
  previewSubmodules: string[];
  onboardingCompleted: boolean;
};

export function useOnboardingState() {
  return useQuery({
    queryKey: ["tenant", "onboarding"],
    queryFn: () => fetchApi<OnboardingStateResponse>("/api/tenant/onboarding"),
  });
}

export function useSaveOnboardingDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draft: OnboardingDraftInput) =>
      fetchApi<{ draft: OnboardingDraftInput; previewModules: string[]; previewSubmodules: string[] }>(
        "/api/tenant/onboarding",
        {
          method: "PATCH",
          body: JSON.stringify(draft),
        }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant", "onboarding"] }),
  });
}

export function useConfirmOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi<{ completedAt: string; enabledModules: string[]; enabledSubmodules: string[] }>(
        "/api/tenant/onboarding/confirm",
        {
          method: "POST",
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant", "onboarding"] });
      qc.invalidateQueries({ queryKey: ["tenant", "modules"] });
    },
  });
}
