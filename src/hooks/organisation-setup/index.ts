import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import type { BranchListItem } from "@/lib/organisation-setup/mappers";
import type { TenantModuleOption } from "@/lib/organisation-setup/module-availability";
import type { CreateBranchInput, CompanyInformationInput } from "@/validators/organisation-setup";
import type { CompanyProfileDraftInput, CompanyProfileInput } from "@/validators/company-profile";
import type { CompanyInformation } from "@/repositories/organisation-setup/company-information";
import type { CompanyProfileRecord } from "@/lib/organisation-setup/company-profile/mappers";
import type { calculateProfileProgress } from "@/lib/organisation-setup/company-profile/completion";

export type CompanyProfileResponse = CompanyProfileRecord & {
  progress: ReturnType<typeof calculateProfileProgress>;
  sections: number;
};

export type BranchesListResponse = {
  data: BranchListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  filters: { status: string | null; designation: string | null };
  tenant: {
    name: string;
    status: string;
    businessType: string;
    businessSubcategory: string | null;
  } | null;
  availableModules: TenantModuleOption[];
  hasPrimaryOffice?: boolean;
};

export type BranchListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  designation?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

function buildQuery(params: BranchListParams) {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.designation) sp.set("designation", params.designation);
  if (params.sortBy) sp.set("sortBy", params.sortBy);
  if (params.sortOrder) sp.set("sortOrder", params.sortOrder);
  return sp.toString();
}

export function useBranchesSetup(params: BranchListParams = {}) {
  return useQuery({
    queryKey: ["branches-setup", params],
    queryFn: () => fetchApi<BranchesListResponse>(`/api/branches?${buildQuery(params)}`),
  });
}

export function useBranchSetupMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["branches-setup"] });

  return {
    create: useMutation({
      mutationFn: (body: CreateBranchInput) =>
        fetchApi<BranchListItem>("/api/branches", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Partial<CreateBranchInput>) =>
        fetchApi<BranchListItem>(`/api/branches/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/branches/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
    toggleStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) =>
        fetchApi<BranchListItem>(`/api/branches/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      onSuccess: invalidate,
    }),
    validateCode: useMutation({
      mutationFn: (payload: { branch_code: string; exclude_branch_id?: string }) =>
        fetchApi<{ available: boolean }>("/api/branches/validate-code", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
    }),
  };
}

export function useCompanyProfile() {
  return useQuery({
    queryKey: ["company-profile"],
    queryFn: () => fetchApi<CompanyProfileResponse>("/api/company-profile"),
  });
}

export function useCompanyProfileMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["company-profile"] });

  return {
    save: useMutation({
      mutationFn: (body: CompanyProfileDraftInput) =>
        fetchApi<CompanyProfileResponse>("/api/company-profile", {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
    saveDraft: useMutation({
      mutationFn: (body: CompanyProfileDraftInput) =>
        fetchApi<CompanyProfileResponse>("/api/company-profile?draft=true", {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
    create: useMutation({
      mutationFn: (body: CompanyProfileInput) =>
        fetchApi<CompanyProfileResponse>("/api/company-profile", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
  };
}

/** @deprecated Use useCompanyProfile */
export function useCompanyInformation() {
  return useQuery({
    queryKey: ["company-information"],
    queryFn: () => fetchApi<CompanyInformation | null>("/api/company-information"),
  });
}

export function useCompanyInformationMutations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CompanyInformationInput) =>
      fetchApi<CompanyInformation>("/api/company-information", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-information"] }),
  });
}

export type WhatsAppConfigResponse = {
  config: {
    tenantId: string;
    phoneNumberId: string | null;
    businessAccountId: string | null;
    accessTokenSet: boolean;
    webhookVerifyToken: string | null;
    isActive: boolean;
    updatedAt: string | null;
  } | null;
  webhookUrl: string;
  migrationRequired?: boolean;
};

export function useWhatsAppConfig() {
  return useQuery({
    queryKey: ["whatsapp-config"],
    queryFn: () => fetchApi<WhatsAppConfigResponse>("/api/organisation/whatsapp-config"),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useWhatsAppConfigMutations() {
  const qc = useQueryClient();
  return {
    save: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<WhatsAppConfigResponse>("/api/organisation/whatsapp-config", {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-config"] }),
    }),
    test: useMutation({
      mutationFn: (body: {
        phoneNumberId: string;
        businessAccountId?: string;
        accessToken?: string;
      }) =>
        fetchApi<{ displayPhoneNumber: string | null; verifiedName: string | null }>(
          "/api/organisation/whatsapp-config",
          { method: "POST", body: JSON.stringify({ action: "test", ...body }) }
        ),
    }),
  };
}

export type DograhConfigResponse = {
  config: {
    tenantId: string;
    serverUrl: string | null;
    apiKeySet: boolean;
    publicAppUrl: string | null;
    isActive: boolean;
    updatedAt: string | null;
  } | null;
  resolved: { serverUrl: string; publicAppUrl: string; isActive: boolean } | null;
  envFallback: { serverUrl: string | null; apiKeySet: boolean; publicAppUrl: string };
  customerUrl: string;
  webhookUrl: string;
  updateStatusUrl: string;
  migrationRequired?: boolean;
};

export function useDograhConfig() {
  return useQuery({
    queryKey: ["dograh-config"],
    queryFn: () => fetchApi<DograhConfigResponse>("/api/organisation/dograh-config"),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useDograhConfigMutations() {
  const qc = useQueryClient();
  return {
    save: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<DograhConfigResponse>("/api/organisation/dograh-config", {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["dograh-config"] }),
    }),
    test: useMutation({
      mutationFn: (body: { serverUrl?: string; apiKey?: string }) =>
        fetchApi<{ message: string }>("/api/organisation/dograh-config", {
          method: "POST",
          body: JSON.stringify({ action: "test", ...body }),
        }),
    }),
  };
}
