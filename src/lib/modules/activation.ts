import {
  MODULES_BY_BUSINESS_TYPE,
  MODULES_BY_INDUSTRY_SUBTYPE,
  SUBMODULES_BY_BUSINESS_TYPE,
  SUBMODULES_BY_INDUSTRY_SUBTYPE,
  SUBMODULE_LABELS,
  type BusinessType,
  type ErpModuleKey,
  type ErpSubmoduleKey,
} from "@/constants/onboarding";

export type OnboardingProvisioning = {
  modules: ErpModuleKey[];
  submodules: ErpSubmoduleKey[];
};

export function resolveModulesForBusinessType(businessType: string): ErpModuleKey[] {
  const key = businessType as BusinessType;
  if (key in MODULES_BY_BUSINESS_TYPE) {
    return [...MODULES_BY_BUSINESS_TYPE[key]];
  }
  return [...MODULES_BY_BUSINESS_TYPE.Hybrid];
}

export function resolveSubmodulesForBusinessType(businessType: string): ErpSubmoduleKey[] {
  const key = businessType as BusinessType;
  if (key in SUBMODULES_BY_BUSINESS_TYPE) {
    return [...SUBMODULES_BY_BUSINESS_TYPE[key]];
  }
  return [...SUBMODULES_BY_BUSINESS_TYPE.Hybrid];
}

export function resolveModulesForOnboarding(
  businessType: string,
  industrySubtype?: string | null
): ErpModuleKey[] {
  if (industrySubtype && industrySubtype in MODULES_BY_INDUSTRY_SUBTYPE) {
    return [...MODULES_BY_INDUSTRY_SUBTYPE[industrySubtype]];
  }
  return resolveModulesForBusinessType(businessType);
}

export function resolveSubmodulesForOnboarding(
  businessType: string,
  industrySubtype?: string | null
): ErpSubmoduleKey[] {
  if (industrySubtype && industrySubtype in SUBMODULES_BY_INDUSTRY_SUBTYPE) {
    return [...SUBMODULES_BY_INDUSTRY_SUBTYPE[industrySubtype]];
  }
  return resolveSubmodulesForBusinessType(businessType);
}

export function resolveOnboardingProvisioning(
  businessType: string,
  industrySubtype?: string | null
): OnboardingProvisioning {
  return {
    modules: resolveModulesForOnboarding(businessType, industrySubtype),
    submodules: resolveSubmodulesForOnboarding(businessType, industrySubtype),
  };
}

export function moduleLabel(key: ErpModuleKey): string {
  const labels: Record<ErpModuleKey, string> = {
    HR: "Human Resources",
    Finance: "Finance & Billing",
    Sales: "Sales, CRM & Orders",
    Projects: "Projects & Time Tracking",
    Operations: "Inventory & Operations",
    Marketing: "Marketing",
  };
  return labels[key] ?? key;
}

export function submoduleLabel(key: ErpSubmoduleKey): string {
  return SUBMODULE_LABELS[key] ?? key;
}
