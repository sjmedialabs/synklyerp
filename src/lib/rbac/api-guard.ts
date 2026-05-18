import { requireTenantSession, resolveTenantId, type SessionContext } from "@/lib/tenant/context";
import { resolveModuleForApiPath } from "@/lib/modules/path-access";
import { requireTenantModule } from "@/lib/modules/module-guard";
import type { ErpModuleKey } from "@/constants/onboarding";
import { requirePermission, type PermissionCheck } from "@/lib/rbac/permissions";

export type TenantApiContext = SessionContext & { tenantId: string };

export type TenantApiOptions = {
  /** When set, enforces tenant module activation for the request path. */
  req?: Request;
  /** Explicit module key (used when the handler has no Request argument). */
  module?: ErpModuleKey;
};

export async function getTenantApiContext(
  check?: PermissionCheck,
  options?: TenantApiOptions
): Promise<TenantApiContext> {
  const ctx = await requireTenantSession();
  const tenantId = await resolveTenantId(ctx);
  const full: TenantApiContext = { ...ctx, tenantId };

  const moduleKey =
    options?.module ??
    (options?.req ? resolveModuleForApiPath(new URL(options.req.url).pathname) : null);

  if (moduleKey) {
    await requireTenantModule(tenantId, moduleKey);
  }

  if (check) await requirePermission(full, check);
  return full;
}
