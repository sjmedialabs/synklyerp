import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import type {
  OrgTax,
  Service,
  PricingRule,
  ServicePackage,
  ServiceSLA,
  Lead,
  Project,
  Employee,
  Attendance,
} from "@/lib/mappers/modules";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "Request failed");
  return json.data as T;
}

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams({ limit: "100" });
  for (const [k, v] of Object.entries(params)) {
    if (v) u.set(k, v);
  }
  return u.toString();
}

export function useOrgTaxes(search = "") {
  return useQuery({
    queryKey: ["org-taxes", search],
    queryFn: () => getJson<OrgTax[]>(`/api/organisation/taxes?${qs({ search })}`),
  });
}

export function useOrgTaxMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["org-taxes"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) => fetchApi<OrgTax>("/api/organisation/taxes", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<OrgTax>(`/api/organisation/taxes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/organisation/taxes/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

export function useServices(search = "") {
  return useQuery({
    queryKey: ["services", search],
    queryFn: () => getJson<Service[]>(`/api/finance/services?${qs({ search })}`),
  });
}

export function useServiceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["services"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) => fetchApi<Service>("/api/finance/services", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<Service>(`/api/finance/services/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/finance/services/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

export function usePricingRules(search = "") {
  return useQuery({
    queryKey: ["pricing-rules", search],
    queryFn: () => getJson<PricingRule[]>(`/api/finance/pricing?${qs({ search })}`),
  });
}

export function usePricingMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["pricing-rules"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) => fetchApi<PricingRule>("/api/finance/pricing", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<PricingRule>(`/api/finance/pricing/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/finance/pricing/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

export function useServicePackages(search = "") {
  return useQuery({
    queryKey: ["service-packages", search],
    queryFn: () => getJson<ServicePackage[]>(`/api/finance/packages?${qs({ search })}`),
  });
}

export function usePackageMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["service-packages"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) => fetchApi<ServicePackage>("/api/finance/packages", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<ServicePackage>(`/api/finance/packages/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/finance/packages/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

export function useServiceSlas(search = "") {
  return useQuery({
    queryKey: ["service-slas", search],
    queryFn: () => getJson<ServiceSLA[]>(`/api/finance/sla?${qs({ search })}`),
  });
}

export function useSlaMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["service-slas"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) => fetchApi<ServiceSLA>("/api/finance/sla", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<ServiceSLA>(`/api/finance/sla/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/finance/sla/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

export function useLeads(search = "", status = "") {
  return useQuery({
    queryKey: ["leads", search, status],
    queryFn: () => getJson<Lead[]>(`/api/sales/leads?${qs({ search, status })}`),
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: ["lead-stats"],
    queryFn: () => getJson<{ total: number; byStatus: Record<string, number> }>("/api/sales/leads/stats"),
  });
}

export function useLeadMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["lead-stats"] });
  };
  return {
    create: useMutation({
      mutationFn: (body: unknown) => fetchApi<Lead>("/api/sales/leads", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<Lead>(`/api/sales/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/sales/leads/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

export function useProjects(search = "", status = "") {
  return useQuery({
    queryKey: ["projects", search, status],
    queryFn: () => getJson<Project[]>(`/api/projects?${qs({ search, status })}`),
  });
}

export function useProjectStats() {
  return useQuery({
    queryKey: ["project-stats"],
    queryFn: () => getJson<{ total: number; byStatus: Record<string, number> }>("/api/projects/stats"),
  });
}

export function useProjectMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["project-stats"] });
  };
  return {
    create: useMutation({
      mutationFn: (body: unknown) => fetchApi<Project>("/api/projects", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<Project>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/projects/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

export function useEmployees(search = "", status = "") {
  return useQuery({
    queryKey: ["employees", search, status],
    queryFn: () => getJson<Employee[]>(`/api/hr/employees?${qs({ search, status })}`),
  });
}

export function useEmployeeStats() {
  return useQuery({
    queryKey: ["employee-stats"],
    queryFn: () =>
      getJson<{ total: number; active: number; onProbation: number; newThisMonth: number }>("/api/hr/employees/stats"),
  });
}

export function useEmployeeMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["employees"] });
    qc.invalidateQueries({ queryKey: ["employee-stats"] });
  };
  return {
    create: useMutation({
      mutationFn: (body: unknown) => fetchApi<Employee>("/api/hr/employees", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<Employee>(`/api/hr/employees/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/hr/employees/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

export function useAttendance(date: string) {
  return useQuery({
    queryKey: ["attendance", date],
    queryFn: () => getJson<Attendance[]>(`/api/hr/attendance?date=${encodeURIComponent(date)}&limit=200`),
  });
}

export function useAttendanceSummary(date: string) {
  return useQuery({
    queryKey: ["attendance-summary", date],
    queryFn: () => getJson<{ present: number; late: number; absent: number; onLeave: number }>(`/api/hr/attendance/summary?date=${encodeURIComponent(date)}`),
  });
}

export function useAttendanceMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["attendance"] });
    qc.invalidateQueries({ queryKey: ["attendance-summary"] });
  };
  return {
    upsert: useMutation({
      mutationFn: (body: unknown) => fetchApi<Attendance>("/api/hr/attendance", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
  };
}
