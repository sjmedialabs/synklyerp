import {
  MODULES_BY_BUSINESS_TYPE,
  type BusinessType,
  type ErpModuleKey,
} from "@/constants/onboarding";

export function resolveModulesForBusinessType(businessType: string): ErpModuleKey[] {
  const key = businessType as BusinessType;
  if (key in MODULES_BY_BUSINESS_TYPE) {
    return [...MODULES_BY_BUSINESS_TYPE[key]];
  }
  return [...MODULES_BY_BUSINESS_TYPE.Hybrid];
}

export function moduleLabel(key: ErpModuleKey): string {
  const labels: Record<ErpModuleKey, string> = {
    HR: "Human Resources",
    Finance: "Finance",
    Sales: "Sales & CRM",
    Projects: "Project Management",
    Operations: "Operations",
    Marketing: "Marketing",
  };
  return labels[key] ?? key;
}
