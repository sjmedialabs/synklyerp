import type { ErpModuleKey } from "@/constants/onboarding";

const PATH_PREFIX_TO_MODULE: { prefix: string; module: ErpModuleKey }[] = [
  { prefix: "/app/hr", module: "HR" },
  { prefix: "/app/finance", module: "Finance" },
  { prefix: "/app/sales", module: "Sales" },
  { prefix: "/app/marketing", module: "Marketing" },
  { prefix: "/app/projects", module: "Projects" },
  { prefix: "/app/operations", module: "Operations" },
];

/** App paths that are always reachable regardless of tenant module activation. */
const MODULE_EXEMPT_PREFIXES = [
  "/app/settings",
  "/app/setup",
  "/app/organisation",
  "/app/module-unavailable",
];

/**
 * Returns the ERP module key required for a dashboard path, or null if unrestricted.
 */
export function resolveModuleForAppPath(pathname: string): ErpModuleKey | null {
  if (!pathname.startsWith("/app")) return null;
  if (pathname === "/app") return null;

  for (const exempt of MODULE_EXEMPT_PREFIXES) {
    if (pathname === exempt || pathname.startsWith(`${exempt}/`)) return null;
  }

  for (const { prefix, module } of PATH_PREFIX_TO_MODULE) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return module;
  }

  return null;
}

export function isModuleEnabledForPath(pathname: string, enabledModules: string[] | undefined): boolean {
  const required = resolveModuleForAppPath(pathname);
  if (!required) return true;
  return (enabledModules ?? []).includes(required);
}

const API_PREFIX_TO_MODULE: { prefix: string; module: ErpModuleKey }[] = [
  { prefix: "/api/hr", module: "HR" },
  { prefix: "/api/finance", module: "Finance" },
  { prefix: "/api/sales", module: "Sales" },
  { prefix: "/api/marketing", module: "Marketing" },
  { prefix: "/api/projects", module: "Projects" },
  { prefix: "/api/operations", module: "Operations" },
];

const API_MODULE_EXEMPT_PREFIXES = [
  "/api/organisation",
  "/api/branches",
  "/api/company-profile",
  "/api/company-information",
  "/api/business-types",
  "/api/onboarding",
  "/api/tenant",
  "/api/dashboard",
  "/api/activity-logs",
  "/api/notifications",
  "/api/v1/public",
];

/** Returns ERP module required for a REST path, or null if unrestricted. */
export function resolveModuleForApiPath(pathname: string): ErpModuleKey | null {
  if (!pathname.startsWith("/api")) return null;

  for (const exempt of API_MODULE_EXEMPT_PREFIXES) {
    if (pathname === exempt || pathname.startsWith(`${exempt}/`)) return null;
  }

  for (const { prefix, module } of API_PREFIX_TO_MODULE) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return module;
  }

  return null;
}
