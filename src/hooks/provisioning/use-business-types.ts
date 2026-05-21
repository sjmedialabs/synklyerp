"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";

export type BusinessTypeCatalogItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  legacyKey: string | null;
  subcategories: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    legacyKey: string | null;
  }[];
  defaultModules: string[];
  defaultSubmodules: string[];
};

export function useBusinessTypes() {
  return useQuery({
    queryKey: ["business-types"],
    queryFn: () => fetchApi<BusinessTypeCatalogItem[]>("/api/business-types"),
    staleTime: 300_000,
  });
}

export function resolveCatalogSelection(
  catalog: BusinessTypeCatalogItem[] | undefined,
  legacyBusinessType: string,
  legacySubcategory: string
) {
  if (!catalog?.length) return null;
  const type =
    catalog.find((t) => t.legacyKey === legacyBusinessType) ??
    catalog.find((t) => t.slug === legacyBusinessType.toLowerCase());
  if (!type) return null;
  const subcategory =
    type.subcategories.find((s) => s.legacyKey === legacySubcategory) ??
    type.subcategories.find((s) => s.name === legacySubcategory);
  if (!subcategory) return null;
  return { type, subcategory };
}
