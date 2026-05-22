"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import type { SidebarResponse } from "@/lib/sidebar/types";

export function useSidebar() {
  return useQuery({
    queryKey: ["sidebar"],
    queryFn: () => fetchApi<SidebarResponse>("/api/sidebar"),
    staleTime: 120_000,
  });
}

export function useSidebarTemplate() {
  return useQuery({
    queryKey: ["sidebar", "template"],
    queryFn: () => fetchApi<{ id: string; name: string; slug: string } | null>("/api/sidebar/template"),
    staleTime: 300_000,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { menuSlug: string; favorite: boolean }) =>
      fetchApi("/api/sidebar/favorites", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sidebar"] }),
  });
}

export function useTrackRecentMenu() {
  return useMutation({
    mutationFn: (input: { path: string; name: string; slug: string }) =>
      fetchApi("/api/sidebar/recent", { method: "POST", body: JSON.stringify(input) }),
  });
}
