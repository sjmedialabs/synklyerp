import { buildPermissionCatalog, type PermissionAction } from "@/constants/permissions";
import { PERM_MODULE_TO_ERP } from "@/constants/onboarding";
import type { ErpModuleKey } from "@/constants/onboarding";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPermissionEnabledForRole, TENANT_SYSTEM_ROLES, type SystemRoleName } from "@/lib/rbac/role-matrix";

export async function upsertPermissionCatalog() {
  const supabase = createAdminClient();
  const catalog = buildPermissionCatalog();

  for (const chunk of chunkArray(catalog, 50)) {
    const { error } = await supabase.from("permissions").upsert(
      chunk.map((p) => ({ ...p, description: `${p.module}.${p.feature}.${p.action}` })),
      { onConflict: "module,feature,action" }
    );
    if (error) throw error;
  }
}

export async function ensureTenantSystemRoles(tenantId: string) {
  const supabase = createAdminClient();
  const roles: { id: string; name: SystemRoleName }[] = [];

  for (const def of TENANT_SYSTEM_ROLES) {
    const { data: existing } = await supabase
      .from("roles")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .eq("name", def.name)
      .maybeSingle();

    if (existing) {
      roles.push({ id: (existing as { id: string }).id, name: def.name as SystemRoleName });
      continue;
    }

    const { data, error } = await supabase
      .from("roles")
      .insert({
        tenant_id: tenantId,
        name: def.name,
        description: def.description,
        is_system: true,
      })
      .select("id, name")
      .single();

    if (error) throw error;
    roles.push({ id: (data as { id: string }).id, name: def.name });
  }

  return roles;
}

export async function syncRolePermissionsForTenant(tenantId: string, enabledModules?: ErpModuleKey[]) {
  await upsertPermissionCatalog();

  const supabase = createAdminClient();
  const roles = await ensureTenantSystemRoles(tenantId);
  const enabled = enabledModules?.length ? new Set<string>(enabledModules) : null;

  const { data: permissions, error: permErr } = await supabase.from("permissions").select("id, module, feature, action");
  if (permErr) throw permErr;

  for (const role of roles) {
    const rows = (permissions ?? [])
      .map((p) => {
        const perm = p as { id: string; module: string; feature: string; action: string };
        return {
          role_id: role.id,
          permission_id: perm.id,
          enabled: isPermissionEnabledForRole(role.name, {
            module: perm.module,
            feature: perm.feature,
            action: perm.action as PermissionAction,
          }),
          perm,
        };
      })
      .filter((r) => r.enabled)
      .filter((r) => {
        if (!enabled) return true;
        const mapped = PERM_MODULE_TO_ERP[r.perm.module];
        if (!mapped || mapped === "organisation" || mapped === "tenant") return true;
        return enabled.has(mapped);
      })
      .map(({ role_id, permission_id, enabled: isEnabled }) => ({
        role_id,
        permission_id,
        enabled: isEnabled,
      }));

    for (const chunk of chunkArray(rows, 100)) {
      const { error } = await supabase.from("role_permissions").upsert(chunk, {
        onConflict: "role_id,permission_id",
      });
      if (error) throw error;
    }
  }

  return roles;
}

export async function getTenantRoleId(tenantId: string, roleName: SystemRoleName) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("name", roleName)
    .maybeSingle();
  if (error) throw error;
  return (data as { id: string } | null)?.id ?? null;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
