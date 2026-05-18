import { permissionKey, type PermissionAction } from "@/constants/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/types/auth";
import type { SessionContext } from "@/lib/tenant/context";
import { isPermissionEnabledForRole, type SystemRoleName } from "@/lib/rbac/role-matrix";

export type PermissionCheck = {
  module: string;
  feature: string;
  action?: PermissionAction;
};

const ADMIN_ROLES: AppRole[] = ["ADMIN", "SUPERADMIN"];

function resolveRoleName(
  roles: { name: string } | { name: string }[] | null | undefined,
  fallback: AppRole
): SystemRoleName {
  const row = Array.isArray(roles) ? roles[0] : roles;
  return (row?.name ?? fallback) as SystemRoleName;
}

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function userHasPermission(
  userId: string,
  role: AppRole,
  tenantId: string,
  check: PermissionCheck
): Promise<boolean> {
  if (ADMIN_ROLES.includes(role)) return true;

  const action = check.action ?? "read";
  const supabase = createAdminClient();

  const { data: override } = await supabase
    .from("user_permissions")
    .select("enabled")
    .eq("user_id", userId)
    .eq("module", check.module)
    .eq("feature", check.feature)
    .maybeSingle();

  if (override && (override as { enabled: boolean }).enabled) return true;
  if (override && !(override as { enabled: boolean }).enabled) return false;

  const { data: user } = await supabase
    .from("users")
    .select("role_id, roles:role_id ( name )")
    .eq("id", userId)
    .maybeSingle();

  if (!user?.role_id) {
    return role !== "VIEWER" && action === "read";
  }

  const roleName = resolveRoleName(
    (user as { roles: { name: string } | { name: string }[] | null }).roles,
    role
  );

  const { data: perm } = await supabase
    .from("permissions")
    .select("id")
    .eq("module", check.module)
    .eq("feature", check.feature)
    .eq("action", action)
    .maybeSingle();

  if (perm) {
    const { data: rolePerm } = await supabase
      .from("role_permissions")
      .select("enabled")
      .eq("role_id", user.role_id)
      .eq("permission_id", (perm as { id: string }).id)
      .maybeSingle();

    if (rolePerm != null) return (rolePerm as { enabled: boolean }).enabled === true;
  }

  if (["ADMIN", "MANAGER", "USER", "VIEWER"].includes(roleName)) {
    return isPermissionEnabledForRole(roleName as SystemRoleName, {
      module: check.module,
      feature: check.feature,
      action,
    });
  }

  return false;
}

export async function listUserPermissions(
  userId: string,
  role: AppRole,
  tenantId: string
): Promise<string[]> {
  if (ADMIN_ROLES.includes(role)) {
    const { buildPermissionCatalog } = await import("@/constants/permissions");
    return buildPermissionCatalog().map((p) => permissionKey(p.module, p.feature, p.action));
  }

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("role_id, roles:role_id ( name )")
    .eq("id", userId)
    .maybeSingle();

  const roleName = user
    ? resolveRoleName(
        (user as { roles: { name: string } | { name: string }[] | null }).roles,
        role
      )
    : (role as SystemRoleName);

  const { data: permissions } = await supabase.from("permissions").select("id, module, feature, action");
  const enabled = new Set<string>();

  if (user?.role_id) {
    const { data: rolePerms } = await supabase
      .from("role_permissions")
      .select("enabled, permissions:permission_id ( module, feature, action )")
      .eq("role_id", user.role_id)
      .eq("enabled", true);

    for (const rp of rolePerms ?? []) {
      const perm = unwrapJoin(
        (rp as { permissions: { module: string; feature: string; action: string } | { module: string; feature: string; action: string }[] | null })
          .permissions
      );
      if (perm) enabled.add(permissionKey(perm.module, perm.feature, perm.action));
    }
  }

  if (enabled.size === 0 && ["ADMIN", "MANAGER", "USER", "VIEWER"].includes(roleName)) {
    for (const row of permissions ?? []) {
      const p = row as { module: string; feature: string; action: PermissionAction };
      if (
        isPermissionEnabledForRole(roleName as SystemRoleName, p)
      ) {
        enabled.add(permissionKey(p.module, p.feature, p.action));
      }
    }
  }

  const { data: overrides } = await supabase
    .from("user_permissions")
    .select("module, feature, enabled")
    .eq("user_id", userId);

  for (const o of overrides ?? []) {
    const row = o as { module: string; feature: string; enabled: boolean };
    for (const action of ["read", "create", "update", "delete"] as const) {
      const key = permissionKey(row.module, row.feature, action);
      if (row.enabled) enabled.add(key);
      else enabled.delete(key);
    }
  }

  return [...enabled];
}

export async function requirePermission(
  ctx: SessionContext & { tenantId: string },
  check: PermissionCheck
): Promise<void> {
  const allowed = await userHasPermission(ctx.userId, ctx.role, ctx.tenantId, check);
  if (!allowed) throw new Error("FORBIDDEN");
}

export function canReadModule(
  permissions: Set<string> | string[],
  module: string,
  feature: string
): boolean {
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  return set.has(permissionKey(module, feature, "read"));
}
