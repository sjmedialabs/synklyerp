import type { ErpModuleKey, ErpSubmoduleKey } from "@/constants/onboarding";
import { MODULES_BY_INDUSTRY_SUBTYPE, SUBMODULES_BY_INDUSTRY_SUBTYPE } from "@/constants/onboarding";
import { hybridBusinessConfig } from "./hybrid-business.config";
import { productBusinessConfig } from "./product-business.config";
import { serviceBusinessConfig } from "./service-business.config";
import type { BusinessConfigSlug, BusinessTypeConfig, ResolvedBusinessConfig, SubcategoryConfigOverride } from "./types";

export const BUSINESS_CONFIGS: Record<BusinessConfigSlug, BusinessTypeConfig> = {
  product: productBusinessConfig,
  service: serviceBusinessConfig,
  hybrid: hybridBusinessConfig,
};

const SUBCATEGORY_OVERRIDES: SubcategoryConfigOverride[] = [
  {
    subcategorySlug: "retail",
    dashboards: [{ widgetCode: "kpi-operations", order: 1, column: 1, span: 1, visible: true }],
  },
  { subcategorySlug: "it-services", roleTemplates: serviceBusinessConfig.roleTemplates },
  { subcategorySlug: "franchise", workflows: hybridBusinessConfig.workflows },
];

export function getBusinessConfigBySlug(slug: string): BusinessTypeConfig | null {
  if (slug in BUSINESS_CONFIGS) return BUSINESS_CONFIGS[slug as BusinessConfigSlug];
  return null;
}

export function getBusinessConfigByLegacyKey(legacyKey: string): BusinessTypeConfig | null {
  return Object.values(BUSINESS_CONFIGS).find((c) => c.legacyKey === legacyKey) ?? null;
}

export function resolveBusinessConfig(
  businessTypeSlug: string,
  subcategorySlug?: string | null,
  legacySubcategoryName?: string | null
): ResolvedBusinessConfig {
  const base = getBusinessConfigBySlug(businessTypeSlug) ?? hybridBusinessConfig;
  const override = subcategorySlug
    ? SUBCATEGORY_OVERRIDES.find((o) => o.subcategorySlug === subcategorySlug)
    : undefined;

  let erpModules: ErpModuleKey[] = [...new Set(base.modules.map((m) => m.erpModule))];
  let erpSubmodules: ErpSubmoduleKey[] = base.submodules.map((s) => s.code);

  if (legacySubcategoryName && legacySubcategoryName in MODULES_BY_INDUSTRY_SUBTYPE) {
    erpModules = [...MODULES_BY_INDUSTRY_SUBTYPE[legacySubcategoryName]];
  }
  if (legacySubcategoryName && legacySubcategoryName in SUBMODULES_BY_INDUSTRY_SUBTYPE) {
    erpSubmodules = [...SUBMODULES_BY_INDUSTRY_SUBTYPE[legacySubcategoryName]];
  }

  return {
    ...base,
    erpModules,
    erpSubmodules,
    dashboards: override?.dashboards ?? base.dashboards,
    workflows: override?.workflows ?? base.workflows,
    roleTemplates: override?.roleTemplates ?? base.roleTemplates,
    enabledModuleRows: buildEnabledModuleRows(base, erpModules, erpSubmodules),
  };
}

function buildEnabledModuleRows(
  base: BusinessTypeConfig,
  erpModules: ErpModuleKey[],
  erpSubmodules: ErpSubmoduleKey[]
) {
  const rows: { moduleCode: string; submoduleCode: string | null }[] = [];
  for (const mod of erpModules) {
    rows.push({ moduleCode: mod, submoduleCode: null });
  }
  for (const sub of erpSubmodules) {
    const meta = base.submodules.find((s) => s.code === sub);
    rows.push({ moduleCode: meta?.erpModule ?? "Operations", submoduleCode: sub });
  }
  return rows;
}

export type { BusinessTypeConfig, ResolvedBusinessConfig } from "./types";
