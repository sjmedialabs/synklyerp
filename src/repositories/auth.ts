import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/types/auth";

export async function findUserByEmail(email: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id, name, email, password_hash, status, tenant_id,
      roles:role_id ( name ),
      tenants:tenant_id ( name, business_type )
    `
    )
    .eq("email", email.toLowerCase())
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as {
    id: string;
    name: string | null;
    email: string;
    password_hash: string | null;
    status: string;
    tenant_id: string | null;
    roles: { name: string } | { name: string }[] | null;
    tenants: { name: string; business_type: string } | { name: string; business_type: string }[] | null;
  };

  const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
  const tenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    status: row.status,
    tenantId: row.tenant_id,
    roleName: role?.name as AppRole | undefined,
    tenantName: tenant?.name ?? null,
    businessType: tenant?.business_type ?? null,
  };
}
