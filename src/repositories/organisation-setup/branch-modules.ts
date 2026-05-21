import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type BranchModuleRow = {
  moduleCode: string;
  submoduleCode: string | null;
  enabled: boolean;
};

export async function listBranchModules(tenantId: string, branchId: string): Promise<BranchModuleRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("branch_modules")
    .select("module_code, submodule_code, enabled")
    .eq("tenant_id", tenantId)
    .eq("branch_id", branchId);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => ({
    moduleCode: (row as { module_code: string }).module_code,
    submoduleCode: (row as { submodule_code: string | null }).submodule_code,
    enabled: (row as { enabled: boolean }).enabled,
  }));
}

export async function replaceBranchModules(
  tenantId: string,
  branchId: string,
  modules: string[],
  submodules: string[],
  submoduleParentMap: Record<string, string> = {}
) {
  const supabase = createAdminClient();
  const { error: delErr } = await supabase.from("branch_modules").delete().eq("tenant_id", tenantId).eq("branch_id", branchId);
  if (delErr && !isMissingSchemaError(delErr)) throw delErr;
  if (isMissingSchemaError(delErr)) return;

  const rows: { tenant_id: string; branch_id: string; module_code: string; submodule_code: string | null; enabled: boolean }[] = [];
  for (const moduleCode of modules) {
    rows.push({ tenant_id: tenantId, branch_id: branchId, module_code: moduleCode, submodule_code: null, enabled: true });
  }
  for (const sub of submodules) {
    const parent = submoduleParentMap[sub] ?? modules[0] ?? "Operations";
    rows.push({ tenant_id: tenantId, branch_id: branchId, module_code: parent, submodule_code: sub, enabled: true });
  }

  if (!rows.length) return;
  const { error } = await supabase.from("branch_modules").insert(rows);
  if (error) throw error;
}
