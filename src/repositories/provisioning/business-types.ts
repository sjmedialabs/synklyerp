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
  icon: string | null;
  color: string | null;
  themeColor: string | null;
  sortOrder: number;
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
  icon: string | null;
  sortOrder: number;
  enabledModules: string[];
  isActive: boolean;
};

export async function listBusinessTypesWithSubcategories(): Promise<BusinessTypeRecord[]> {
  try {
    const supabase = createAdminClient();
    const { data: types, error } = await supabase
      .from("business_types")
      .select("id, name, slug, description, legacy_key, is_active, icon, color, theme_color, sort_order")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order")
      .order("name");

    if (error) {
      if (isMissingSchemaError(error)) return buildFallbackCatalog();
      throw error;
    }

    const { data: subs, error: subErr } = await supabase
      .from("business_subcategories")
      .select("id, business_type_id, name, slug, description, legacy_key, icon, sort_order, enabled_modules, is_active")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order")
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
      icon: string | null;
      color: string | null;
      theme_color: string | null;
      sort_order: number;
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
          icon: string | null;
          sort_order: number;
          enabled_modules: unknown;
          is_active: boolean;
        };
        return {
          id: sub.id,
          businessTypeId: sub.business_type_id,
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          legacyKey: sub.legacy_key,
          icon: sub.icon,
          sortOrder: sub.sort_order ?? 0,
          enabledModules: Array.isArray(sub.enabled_modules) ? (sub.enabled_modules as string[]) : [],
          isActive: sub.is_active ?? true,
        };
      });

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      legacyKey: row.legacy_key,
      icon: row.icon,
      color: row.color,
      themeColor: row.theme_color,
      sortOrder: row.sort_order ?? 0,
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

  const icons: Record<ConfigSlug, string> = { product: "package", service: "briefcase", hybrid: "zap" };
  const colors: Record<ConfigSlug, string> = { product: "#f59e0b", service: "#6366f1", hybrid: "#eab308" };

  return items.map((item, typeIndex) => ({
    id: `fallback-${item.slug}`,
    name: item.name,
    slug: item.slug,
    description: null,
    legacyKey: item.legacyKey,
    icon: icons[item.slug],
    color: colors[item.slug],
    themeColor: item.slug === "product" ? "amber" : item.slug === "service" ? "indigo" : "yellow",
    sortOrder: typeIndex + 1,
    isActive: true,
    subcategories: INDUSTRY_SUBTYPES[item.legacyKey].map((name, index) => ({
      id: `fallback-${item.slug}-${index}`,
      businessTypeId: `fallback-${item.slug}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: null,
      legacyKey: name,
      icon: "circle",
      sortOrder: index,
      enabledModules: [],
      isActive: true,
    })),
    defaultConfig: resolveBusinessConfig(item.slug),
  }));
}
