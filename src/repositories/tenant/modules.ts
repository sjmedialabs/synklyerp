import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { ErpModuleKey } from "@/constants/onboarding";

export async function listActiveModules(tenantId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenant_modules")
    .select("module_key")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);
  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn("[modules] tenant_modules missing — run migration 005_onboarding_tenant_modules.sql");
      return [];
    }
    throw error;
  }
  return (data ?? []).map((r) => (r as { module_key: string }).module_key);
}

export async function activateModules(tenantId: string, moduleKeys: ErpModuleKey[]) {
  const supabase = createAdminClient();
  const rows = moduleKeys.map((module_key) => ({
    tenant_id: tenantId,
    module_key,
    is_active: true,
    activated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("tenant_modules").upsert(rows, {
    onConflict: "tenant_id,module_key",
  });
  if (error) throw error;
}

export async function deactivateAllModules(tenantId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tenant_modules")
    .update({ is_active: false })
    .eq("tenant_id", tenantId);
  if (error) throw error;
}
