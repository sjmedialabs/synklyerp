import type { PermissionAction } from "@/constants/permissions";
import type { PermissionCheck } from "@/lib/rbac/permissions";

function featurePerms(module: string, feature: string) {
  const actions = ["read", "create", "update", "delete"] as const satisfies readonly PermissionAction[];
  return Object.fromEntries(
    actions.map((action) => [
      action,
      { module, feature, action } satisfies PermissionCheck,
    ])
  ) as Record<(typeof actions)[number], PermissionCheck>;
}

export const P = {
  organisation: {
    branches: featurePerms("organisation", "branches"),
    divisions: featurePerms("organisation", "divisions"),
    designations: featurePerms("organisation", "designations"),
    users: featurePerms("organisation", "users"),
    taxes: featurePerms("organisation", "taxes"),
    roles: featurePerms("organisation", "roles"),
  },
  hr: {
    employees: featurePerms("hr", "employees"),
    attendance: featurePerms("hr", "attendance"),
    payroll: featurePerms("hr", "payroll"),
  },
  finance: {
    services: featurePerms("finance", "services"),
    pricing: featurePerms("finance", "pricing"),
    packages: featurePerms("finance", "packages"),
    sla: featurePerms("finance", "sla"),
  },
  sales: {
    leads: featurePerms("sales", "leads"),
  },
  projects: {
    projects: featurePerms("projects", "projects"),
  },
  tenant: {
    onboarding: featurePerms("tenant", "onboarding"),
    settings: featurePerms("tenant", "settings"),
  },
} as const;
