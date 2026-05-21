import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type EnabledModuleRow = {
  moduleCode: string;
  submoduleCode: string | null;
};

export async function replaceTenantEnabledModules(
  tenantId: string,
  rows: EnabledModuleRow[],
  enabledBy: string
) {
  const supabase = createAdminClient();
  const { error: delErr } = await supabase.from("tenant_enabled_modules").delete().eq("tenant_id", tenantId);
  if (delErr && !isMissingSchemaError(delErr)) throw delErr;
  if (isMissingSchemaError(delErr)) return;

  if (!rows.length) return;

  const now = new Date().toISOString();
  const payload = rows.map((row) => ({
    tenant_id: tenantId,
    module_code: row.moduleCode,
    submodule_code: row.submoduleCode,
    enabled: true,
    enabled_by: enabledBy,
    enabled_at: now,
  }));

  const { error } = await supabase.from("tenant_enabled_modules").insert(payload);
  if (error) throw error;
}

export async function listTenantEnabledModules(tenantId: string): Promise<EnabledModuleRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenant_enabled_modules")
    .select("module_code, submodule_code")
    .eq("tenant_id", tenantId)
    .eq("enabled", true);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  return (data ?? []).map((r) => ({
    moduleCode: (r as { module_code: string }).module_code,
    submoduleCode: (r as { submodule_code: string | null }).submodule_code,
  }));
}

export async function listTenantEnabledSubmoduleCodes(tenantId: string): Promise<string[]> {
  const rows = await listTenantEnabledModules(tenantId);
  return rows.filter((r) => r.submoduleCode).map((r) => r.submoduleCode as string);
}
