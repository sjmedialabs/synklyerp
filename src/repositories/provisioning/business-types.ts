import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { resolveBusinessConfig } from "@/business-configs";
import type { ResolvedBusinessConfig } from "@/business-configs/types";
import { INDUSTRY_SUBTYPES, type BusinessType } from "@/constants/onboarding";

export type BusinessTypeRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  legacyKey: string | null;
  isActive: boolean;
  subcategories: BusinessSubcategoryRecord[];
  defaultConfig: ResolvedBusinessConfig;
};

export type BusinessSubcategoryRecord = {
  id: string;
  businessTypeId: string;
  name: string;
  slug: string;
  description: string | null;
  legacyKey: string | null;
};

export async function listBusinessTypesWithSubcategories(): Promise<BusinessTypeRecord[]> {
  try {
    const supabase = createAdminClient();
    const { data: types, error } = await supabase
      .from("business_types")
      .select("id, name, slug, description, legacy_key, is_active")
      .eq("is_active", true)
      .order("name");

    if (error) {
      if (isMissingSchemaError(error)) return buildFallbackCatalog();
      throw error;
    }

    const { data: subs, error: subErr } = await supabase
      .from("business_subcategories")
      .select("id, business_type_id, name, slug, description, legacy_key")
      .order("name");

    if (subErr) {
      if (isMissingSchemaError(subErr)) return buildFallbackCatalog();
      throw subErr;
    }

    return (types ?? []).map((t) => {
    const row = t as {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      legacy_key: string | null;
      is_active: boolean;
    };
    const subcategories = (subs ?? [])
      .filter((s) => (s as { business_type_id: string }).business_type_id === row.id)
      .map((s) => {
        const sub = s as {
          id: string;
          business_type_id: string;
          name: string;
          slug: string;
          description: string | null;
          legacy_key: string | null;
        };
        return {
          id: sub.id,
          businessTypeId: sub.business_type_id,
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          legacyKey: sub.legacy_key,
        };
      });

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      legacyKey: row.legacy_key,
      isActive: row.is_active,
      subcategories,
      defaultConfig: resolveBusinessConfig(row.slug),
    };
  });
  } catch {
    return buildFallbackCatalog();
  }
}

export async function getBusinessTypeById(id: string) {
  const catalog = await listBusinessTypesWithSubcategories();
  return catalog.find((t) => t.id === id) ?? null;
}

export async function getSubcategoryById(id: string) {
  const catalog = await listBusinessTypesWithSubcategories();
  for (const type of catalog) {
    const sub = type.subcategories.find((s) => s.id === id);
    if (sub) return { type, subcategory: sub };
  }
  return null;
}

export async function resolveByLegacyKeys(businessTypeLegacy: string, subcategoryLegacy: string) {
  const catalog = await listBusinessTypesWithSubcategories();
  const type =
    catalog.find((t) => t.legacyKey === businessTypeLegacy) ??
    catalog.find((t) => t.slug === businessTypeLegacy.toLowerCase());
  if (!type) return null;
  const subcategory =
    type.subcategories.find((s) => s.legacyKey === subcategoryLegacy) ??
    type.subcategories.find((s) => s.name === subcategoryLegacy);
  if (!subcategory) return null;
  return { type, subcategory };
}

function buildFallbackCatalog(): BusinessTypeRecord[] {
  type ConfigSlug = "product" | "service" | "hybrid";
  const items: { slug: ConfigSlug; legacyKey: BusinessType; name: string }[] = [
    { slug: "product", legacyKey: "Product", name: "Product-Based Business" },
    { slug: "service", legacyKey: "Service", name: "Service-Based Business" },
    { slug: "hybrid", legacyKey: "Hybrid", name: "Hybrid Business" },
  ];

  return items.map((item) => ({
    id: `fallback-${item.slug}`,
    name: item.name,
    slug: item.slug,
    description: null,
    legacyKey: item.legacyKey,
    isActive: true,
    subcategories: INDUSTRY_SUBTYPES[item.legacyKey].map((name, index) => ({
      id: `fallback-${item.slug}-${index}`,
      businessTypeId: `fallback-${item.slug}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: null,
      legacyKey: name,
    })),
    defaultConfig: resolveBusinessConfig(item.slug),
  }));
}
