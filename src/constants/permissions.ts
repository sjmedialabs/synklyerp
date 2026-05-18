export const PERMISSION_ACTIONS = ["read", "create", "update", "delete", "export", "approve"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PERMISSION_MODULES = [
  {
    module: "organisation",
    features: ["branches", "divisions", "designations", "users", "taxes", "roles"],
  },
  { module: "hr", features: ["employees", "attendance", "payroll"] },
  { module: "finance", features: ["services", "pricing", "packages", "sla"] },
  { module: "sales", features: ["leads"] },
  { module: "projects", features: ["projects"] },
  { module: "tenant", features: ["onboarding", "settings"] },
] as const;

export type PermissionRecord = {
  module: string;
  feature: string;
  action: PermissionAction;
};

export function buildPermissionCatalog(): PermissionRecord[] {
  const records: PermissionRecord[] = [];
  for (const { module, features } of PERMISSION_MODULES) {
    for (const feature of features) {
      for (const action of PERMISSION_ACTIONS) {
        records.push({ module, feature, action });
      }
    }
  }
  return records;
}

/** Permission key used in client caches: `module:feature:action` */
export function permissionKey(module: string, feature: string, action: string) {
  return `${module}:${feature}:${action}`;
}
