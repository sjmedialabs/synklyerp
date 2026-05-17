import { createAdminClient } from "@/lib/supabase/admin";
import type { PaginatedQuery } from "@/types/api";

export type ActivityLogRow = {
  id: string;
  tenantId: string | null;
  userId: string | null;
  module: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  payload: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
  userName?: string | null;
};

function map(row: Record<string, unknown>): ActivityLogRow {
  const users = row.users as { name: string } | { name: string }[] | null;
  const u = Array.isArray(users) ? users[0] : users;
  return {
    id: row.id as string,
    tenantId: (row.tenant_id as string) ?? null,
    userId: (row.user_id as string) ?? null,
    module: row.module as string,
    action: row.action as string,
    entityType: (row.entity_type as string) ?? null,
    entityId: (row.entity_id as string) ?? null,
    payload: (row.payload as Record<string, unknown>) ?? {},
    ipAddress: (row.ip_address as string) ?? null,
    createdAt: row.created_at as string,
    userName: u?.name ?? null,
  };
}

export async function listActivityLogs(tenantId: string | null, params: PaginatedQuery & { module?: string }) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 30;
  const from = (page - 1) * limit;

  let query = supabase
    .from("activity_logs")
    .select("*, users:user_id ( name )", { count: "exact" })
    .order("created_at", { ascending: false });

  if (tenantId) query = query.eq("tenant_id", tenantId);
  if (params.module) query = query.eq("module", params.module);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(map), total: count ?? 0, page, limit };
}

export async function writeActivityLog(input: {
  tenantId?: string | null;
  userId?: string | null;
  module: string;
  action: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .insert({
      tenant_id: input.tenantId ?? null,
      user_id: input.userId ?? null,
      module: input.module,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      payload: input.payload ?? {},
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    })
    .select()
    .single();
  if (error) {
    console.error("[activity_log]", error.message);
    return null;
  }
  return map(data);
}

export async function recordLoginAttempt(input: {
  userId: string;
  tenantId?: string | null;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const supabase = createAdminClient();
  await supabase.from("login_history").insert({
    user_id: input.userId,
    tenant_id: input.tenantId ?? null,
    success: input.success,
    failure_reason: input.failureReason ?? null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
  });
}
