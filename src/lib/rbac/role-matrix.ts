import type { PermissionAction, PermissionRecord } from "@/constants/permissions";

export type SystemRoleName = "ADMIN" | "MANAGER" | "USER" | "VIEWER";

export function isPermissionEnabledForRole(
  role: SystemRoleName,
  perm: Pick<PermissionRecord, "module" | "feature" | "action">
): boolean {
  if (role === "ADMIN") return true;

  if (role === "VIEWER") {
    return perm.action === "read";
  }

  if (role === "MANAGER") {
    if (perm.module === "organisation" && perm.feature === "users" && perm.action === "delete") {
      return false;
    }
    if (perm.module === "tenant" && perm.feature === "onboarding" && perm.action !== "read") {
      return false;
    }
    return true;
  }

  if (role === "USER") {
    if (perm.action === "read") return true;
    if (perm.module === "sales" && perm.feature === "leads") {
      return ["create", "update"].includes(perm.action);
    }
    if (perm.module === "projects" && perm.feature === "projects") {
      return ["create", "update"].includes(perm.action);
    }
    if (perm.module === "hr" && perm.feature === "attendance") {
      return ["create", "update"].includes(perm.action);
    }
    if (perm.module === "hr" && perm.feature === "employees" && perm.action === "update") {
      return true;
    }
    return false;
  }

  return false;
}

export const TENANT_SYSTEM_ROLES: { name: SystemRoleName; description: string }[] = [
  { name: "ADMIN", description: "Tenant administrator — full workspace access" },
  { name: "MANAGER", description: "Department manager — broad read/write access" },
  { name: "USER", description: "Standard user — operational access" },
  { name: "VIEWER", description: "Read-only access across enabled modules" },
];
