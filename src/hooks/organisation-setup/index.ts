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
