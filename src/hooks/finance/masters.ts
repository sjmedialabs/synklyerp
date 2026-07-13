import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import type { FinanceMasterStatKeys } from "@/lib/finance/masters-tabs";
import type { AccountGroup, ChartOfAccount, CostCenter, FinancialDimension } from "@/lib/mappers/finance-masters";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "Request failed");
  return json.data as T;
}

export function useFinanceMasterStats() {
  return useQuery({
    queryKey: ["finance-master-stats"],
    queryFn: () => getJson<FinanceMasterStatKeys>("/api/finance/masters/stats"),
  });
}

export type CoaListParams = {
  page?: number;
  limit?: number;
  search?: string;
  accountGroupId?: string;
  accountType?: string;
  status?: string;
};

export function useChartOfAccountsList(params: CoaListParams) {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));
  if (params.search) qs.set("search", params.search);
  if (params.accountGroupId) qs.set("accountGroupId", params.accountGroupId);
  if (params.accountType) qs.set("accountType", params.accountType);
  if (params.status) qs.set("status", params.status);

  return useQuery({
    queryKey: ["chart-of-accounts", params],
    queryFn: async () => {
      const res = await fetch(`/api/finance/chart-of-accounts?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Request failed");
      return {
        items: json.data as ChartOfAccount[],
        meta: json.meta as { page: number; limit: number; total: number; totalPages: number },
      };
    },
  });
}

export function useCoaFilterOptions() {
  return useQuery({
    queryKey: ["coa-filter-options"],
    queryFn: () =>
      getJson<{
        accountGroups: { id: string; name: string }[];
        accountTypes: string[];
      }>("/api/finance/chart-of-accounts?filters=true"),
  });
}

export function useCoaParentOptions() {
  return useQuery({
    queryKey: ["coa-parent-options"],
    queryFn: () =>
      getJson<
        { id: string; accountCode: string; accountName: string; accountType: string; level: number }[]
      >("/api/finance/chart-of-accounts?options=true"),
  });
}

export function useAccountGroupsAll() {
  return useQuery({
    queryKey: ["account-groups-all"],
    queryFn: () => getJson<AccountGroup[]>("/api/finance/account-groups?all=true"),
  });
}

export function useChartOfAccountMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["chart-of-accounts"] });
    qc.invalidateQueries({ queryKey: ["finance-master-stats"] });
    qc.invalidateQueries({ queryKey: ["coa-filter-options"] });
    qc.invalidateQueries({ queryKey: ["coa-parent-options"] });
    qc.invalidateQueries({ queryKey: ["finance-dashboard"] });
  };

  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<ChartOfAccount>("/api/finance/chart-of-accounts", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<ChartOfAccount>(`/api/finance/chart-of-accounts/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        fetchApi(`/api/finance/chart-of-accounts/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

// Account Groups
export type AccountGroupsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  groupType?: string;
};

export function useAccountGroupsList(params: AccountGroupsListParams) {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.groupType) qs.set("groupType", params.groupType);

  return useQuery({
    queryKey: ["account-groups", params],
    queryFn: async () => {
      const res = await fetch(`/api/finance/account-groups?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Request failed");
      return {
        items: json.data as AccountGroup[],
        meta: json.meta as { page: number; limit: number; total: number; totalPages: number },
      };
    },
  });
}

export function useAccountGroupStats() {
  return useQuery({
    queryKey: ["account-group-stats"],
    queryFn: () =>
      getJson<{
        total: number;
        active: number;
        inactive: number;
        mappedAccounts: number;
      }>("/api/finance/account-groups/stats"),
  });
}

export function useAccountGroupParentOptions() {
  return useQuery({
    queryKey: ["account-group-parent-options"],
    queryFn: () =>
      getJson<{ id: string; code: string; name: string; groupType: string }[]>(
        "/api/finance/account-groups?options=true"
      ),
  });
}

export function useAccountGroupMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["account-groups"] });
    qc.invalidateQueries({ queryKey: ["account-group-stats"] });
    qc.invalidateQueries({ queryKey: ["account-groups-all"] });
    qc.invalidateQueries({ queryKey: ["account-group-parent-options"] });
    qc.invalidateQueries({ queryKey: ["finance-master-stats"] });
    qc.invalidateQueries({ queryKey: ["coa-filter-options"] });
  };

  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<AccountGroup>("/api/finance/account-groups", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<AccountGroup>(`/api/finance/account-groups/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        fetchApi(`/api/finance/account-groups/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

// Financial Dimensions
export type DimensionsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export function useFinancialDimensionsList(params: DimensionsListParams) {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);

  return useQuery({
    queryKey: ["financial-dimensions", params],
    queryFn: async () => {
      const res = await fetch(`/api/finance/financial-dimensions?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Request failed");
      return {
        items: json.data as FinancialDimension[],
        meta: json.meta as { page: number; limit: number; total: number; totalPages: number },
      };
    },
  });
}

export function useFinancialDimensionStats() {
  return useQuery({
    queryKey: ["financial-dimension-stats"],
    queryFn: () =>
      getJson<{
        total: number;
        active: number;
        inactive: number;
        totalValues: number;
      }>("/api/finance/financial-dimensions/stats"),
  });
}

export function useDimensionValues(dimensionId: string | null) {
  return useQuery({
    queryKey: ["dimension-values", dimensionId],
    enabled: Boolean(dimensionId),
    queryFn: () =>
      getJson<
        {
          id: string;
          valueCode: string;
          valueName: string;
          description: string | null;
          isActive: boolean;
        }[]
      >(`/api/finance/financial-dimensions/${dimensionId}/values`),
  });
}

export function useFinancialDimensionMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["financial-dimensions"] });
    qc.invalidateQueries({ queryKey: ["financial-dimension-stats"] });
    qc.invalidateQueries({ queryKey: ["dimension-values"] });
    qc.invalidateQueries({ queryKey: ["finance-master-stats"] });
  };

  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<FinancialDimension>("/api/finance/financial-dimensions", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<FinancialDimension>(`/api/finance/financial-dimensions/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        fetchApi(`/api/finance/financial-dimensions/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
    createValue: useMutation({
      mutationFn: ({ dimensionId, ...body }: { dimensionId: string } & Record<string, unknown>) =>
        fetchApi(`/api/finance/financial-dimensions/${dimensionId}/values`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
  };
}

// Cost Centers
export type CostCentersListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  costCenterType?: string;
};

export function useCostCentersList(params: CostCentersListParams) {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.costCenterType) qs.set("costCenterType", params.costCenterType);

  return useQuery({
    queryKey: ["cost-centers", params],
    queryFn: async () => {
      const res = await fetch(`/api/finance/cost-centers?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Request failed");
      return {
        items: json.data as CostCenter[],
        meta: json.meta as { page: number; limit: number; total: number; totalPages: number },
      };
    },
  });
}

export function useCostCenterStats() {
  return useQuery({
    queryKey: ["cost-center-stats"],
    queryFn: () =>
      getJson<{
        total: number;
        active: number;
        inactive: number;
        totalBudget: number;
      }>("/api/finance/cost-centers/stats"),
  });
}

export function useCostCenterParentOptions() {
  return useQuery({
    queryKey: ["cost-center-parent-options"],
    queryFn: () =>
      getJson<{ id: string; costCenterCode: string; costCenterName: string }[]>(
        "/api/finance/cost-centers?options=true"
      ),
  });
}

export function useCostCenterMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["cost-centers"] });
    qc.invalidateQueries({ queryKey: ["cost-center-stats"] });
    qc.invalidateQueries({ queryKey: ["cost-center-parent-options"] });
    qc.invalidateQueries({ queryKey: ["finance-master-stats"] });
  };

  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<CostCenter>("/api/finance/cost-centers", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<CostCenter>(`/api/finance/cost-centers/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        fetchApi(`/api/finance/cost-centers/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}
