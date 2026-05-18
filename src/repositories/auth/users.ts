import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth/password";
import { syncRolePermissionsForTenant } from "@/lib/rbac/sync-tenant-roles";
import { getPlanBySlug } from "@/repositories/platform/plans";
import { createSubscriptionForTenant } from "@/repositories/platform/subscriptions";

export async function findUserByPhone(phone: string) {
  const supabase = createAdminClient();
  const normalized = phone.replace(/\s/g, "");
  const { data, error } = await supabase
    .from("users")
    .select(
      `id, name, email, password_hash, status, tenant_id,
      roles:role_id ( name ),
      tenants:tenant_id ( name, business_type )`
    )
    .eq("phone", normalized)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapUser(data);
}

function mapUser(data: Record<string, unknown>) {
  const role = Array.isArray(data.roles) ? (data.roles as { name: string }[])[0] : data.roles;
  const tenant = Array.isArray(data.tenants) ? (data.tenants as { name: string; business_type: string }[])[0] : data.tenants;
  return {
    id: data.id as string,
    name: data.name as string | null,
    email: data.email as string,
    passwordHash: data.password_hash as string | null,
    status: data.status as string,
    tenantId: data.tenant_id as string | null,
    roleName: (role as { name: string } | null)?.name,
    tenantName: (tenant as { name: string } | null)?.name ?? null,
    businessType: (tenant as { business_type: string } | null)?.business_type ?? null,
  };
}

export async function createTenantWithAdmin(input: {
  companyName: string;
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  planSlug?: string;
}) {
  const supabase = createAdminClient();
  const passwordHash = await hashPassword(input.password);

  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .insert({
      name: input.companyName,
      business_type: "Hybrid",
      plan: "TRIAL",
      contact_name: input.fullName,
      contact_email: input.email,
      status: "ACTIVE",
    })
    .select()
    .single();
  if (tenantErr) throw tenantErr;

  const { data: role, error: roleErr } = await supabase
    .from("roles")
    .insert({ tenant_id: tenant.id, name: "ADMIN", description: "Business admin" })
    .select()
    .single();
  if (roleErr) throw roleErr;

  const { data: user, error: userErr } = await supabase
    .from("users")
    .insert({
      tenant_id: tenant.id,
      name: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone?.replace(/\s/g, "") || null,
      password_hash: passwordHash,
      role_id: role.id,
      status: "ACTIVE",
    })
    .select()
    .single();
  if (userErr) throw userErr;

  await syncRolePermissionsForTenant(tenant.id);

  const planSlug = input.planSlug ?? "starter";
  const plan = await getPlanBySlug(planSlug);
  if (plan) {
    await createSubscriptionForTenant(tenant.id, plan);
  }

  return { tenant, user };
}

export async function updateUserPassword(userId: string, password: string) {
  const supabase = createAdminClient();
  const passwordHash = await hashPassword(password);
  const { error } = await supabase.from("users").update({ password_hash: passwordHash }).eq("id", userId);
  if (error) throw error;
}
