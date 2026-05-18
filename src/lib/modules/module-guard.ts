import type { ErpModuleKey } from "@/constants/onboarding";
import { listActiveModules } from "@/repositories/tenant/modules";

export async function requireTenantModule(tenantId: string, module: ErpModuleKey): Promise<void> {
  const active = await listActiveModules(tenantId);
  if (!active.includes(module)) {
    throw new Error("MODULE_DISABLED");
  }
}
