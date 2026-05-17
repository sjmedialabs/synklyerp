import { createAdminClient } from "@/lib/supabase/admin";
import type { PaginatedQuery } from "@/types/api";

export type NotificationRow = {
  id: string;
  tenantId: string | null;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
};

function map(row: Record<string, unknown>): NotificationRow {
  return {
    id: row.id as string,
    tenantId: (row.tenant_id as string) ?? null,
    userId: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    message: row.message as string,
    isRead: Boolean(row.is_read),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

export async function listNotifications(userId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const from = (page - 1) * limit;

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (params.status === "unread") query = query.eq("is_read", false);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(map), total: count ?? 0, page, limit };
}

export async function getUnreadCount(userId: string) {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(userId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  if (error) throw error;
  return { ok: true };
}

export async function createNotification(input: {
  userId: string;
  tenantId?: string | null;
  type?: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      tenant_id: input.tenantId ?? null,
      type: input.type ?? "info",
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return map(data);
}
