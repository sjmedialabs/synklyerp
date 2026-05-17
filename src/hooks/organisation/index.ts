import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import type { Branch, Division, Designation, OrgUser } from "@/lib/mappers/organisation";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "Request failed");
  return json.data as T;
}

export function useBranches(search = "") {
  return useQuery({
    queryKey: ["branches", search],
    queryFn: () => getJson<Branch[]>(`/api/organisation/branches?search=${encodeURIComponent(search)}&limit=100`),
  });
}

export function useBranchMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["branches"] });

  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<Branch>("/api/organisation/branches", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<Branch>(`/api/organisation/branches/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        fetchApi(`/api/organisation/branches/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
    toggleStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) =>
        fetchApi<Branch>(`/api/organisation/branches/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
      onSuccess: invalidate,
    }),
  };
}

export function useDivisions(search = "") {
  return useQuery({
    queryKey: ["divisions", search],
    queryFn: () => getJson<Division[]>(`/api/organisation/divisions?search=${encodeURIComponent(search)}&limit=100`),
  });
}

export function useDivisionMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["divisions"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<Division>("/api/organisation/divisions", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<Division>(`/api/organisation/divisions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/organisation/divisions/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
    toggleStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) =>
        fetchApi<Division>(`/api/organisation/divisions/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
      onSuccess: invalidate,
    }),
  };
}

export function useDesignations(search = "") {
  return useQuery({
    queryKey: ["designations", search],
    queryFn: () => getJson<Designation[]>(`/api/organisation/designations?search=${encodeURIComponent(search)}&limit=100`),
  });
}

export function useDesignationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["designations"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<Designation>("/api/organisation/designations", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<Designation>(`/api/organisation/designations/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/organisation/designations/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
    toggleStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) =>
        fetchApi<Designation>(`/api/organisation/designations/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
      onSuccess: invalidate,
    }),
  };
}

export function useOrgUsers(search = "", status = "") {
  const qs = new URLSearchParams({ limit: "100" });
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);
  return useQuery({
    queryKey: ["org-users", search, status],
    queryFn: () => getJson<OrgUser[]>(`/api/organisation/users?${qs}`),
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ["org-user-stats"],
    queryFn: () => getJson<{ total: number; active: number; managers: number; admins: number }>("/api/organisation/users/stats"),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["org-roles"],
    queryFn: () => getJson<{ id: string; name: string }[]>("/api/organisation/roles"),
  });
}

export function useUserMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["org-users"] });
    qc.invalidateQueries({ queryKey: ["org-user-stats"] });
  };
  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<OrgUser>("/api/organisation/users", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<OrgUser>(`/api/organisation/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/organisation/users/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}
