"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import type {
  CompleteOnboardingInput,
  OrganizationSetupInput,
  SaveOnboardingStepInput,
} from "@/validators/onboarding-session";

export type BusinessTypeOption = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  legacyKey: string | null;
  icon: string | null;
  color: string | null;
  themeColor: string | null;
  sortOrder: number;
  defaultModules: string[];
  defaultSubmodules: string[];
};

export type BusinessCategoryOption = {
  id: string;
  businessTypeId: string;
  name: string;
  slug: string;
  description: string | null;
  legacyKey: string | null;
  icon: string | null;
  sortOrder: number;
  enabledModules: string[];
};

export type BusinessSpecializationOption = {
  id: string;
  businessSubcategoryId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  defaultModules: string[];
};

export type OnboardingSessionResponse = {
  session: {
    id: string;
    tenantId: string;
    currentStep: number;
    businessTypeId: string | null;
    businessCategoryId: string | null;
    businessSpecializationId: string | null;
    organizationData: Partial<OrganizationSetupInput>;
    employeeCount: string | null;
    businessSize: string | null;
  } | null;
  completed: boolean;
  locked: boolean;
};

export function useOnboardingBusinessTypes() {
  return useQuery({
    queryKey: ["onboarding", "business-types"],
    queryFn: () => fetchApi<BusinessTypeOption[]>("/api/onboarding/business-types"),
    staleTime: 300_000,
  });
}

export function useOnboardingCategories(typeId: string | null) {
  return useQuery({
    queryKey: ["onboarding", "categories", typeId],
    queryFn: () => fetchApi<BusinessCategoryOption[]>(`/api/onboarding/categories?typeId=${typeId}`),
    enabled: !!typeId,
    staleTime: 300_000,
  });
}

export function useOnboardingSpecializations(categoryId: string | null) {
  return useQuery({
    queryKey: ["onboarding", "specializations", categoryId],
    queryFn: () =>
      fetchApi<BusinessSpecializationOption[]>(`/api/onboarding/subcategories?categoryId=${categoryId}`),
    enabled: !!categoryId,
    staleTime: 300_000,
  });
}

export function useOnboardingSessionQuery() {
  return useQuery({
    queryKey: ["onboarding", "session"],
    queryFn: () => fetchApi<OnboardingSessionResponse>("/api/onboarding/session"),
  });
}

export function useSaveOnboardingStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveOnboardingStepInput) =>
      fetchApi("/api/onboarding/session", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding", "session"] }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CompleteOnboardingInput) =>
      fetchApi<{ enabledModules: string[]; enabledSubmodules: string[] }>("/api/onboarding/complete", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding"] });
      qc.invalidateQueries({ queryKey: ["tenant"] });
    },
  });
}
