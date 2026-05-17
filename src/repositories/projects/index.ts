import { createAdminClient } from "@/lib/supabase/admin";
import { mapProject } from "@/lib/mappers/modules";
import type { PaginatedQuery } from "@/types/api";

export async function listProjects(tenantId: string, params: PaginatedQuery & { priority?: string }) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;

  let query = supabase.from("projects").select("*", { count: "exact" }).eq("tenant_id", tenantId).is("deleted_at", null).order("created_at", { ascending: false });
  if (params.status) query = query.eq("status", params.status);
  if (params.priority) query = query.eq("priority", params.priority);
  if (params.search) query = query.or(`name.ilike.%${params.search}%,client_name.ilike.%${params.search}%,manager_name.ilike.%${params.search}%`);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapProject), total: count ?? 0, page, limit };
}

export async function getProject(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("projects").select("*").eq("tenant_id", tenantId).eq("id", id).is("deleted_at", null).single();
  if (error) throw error;
  return mapProject(data);
}

export async function getProjectStats(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("projects").select("status").eq("tenant_id", tenantId).is("deleted_at", null);
  const list = data ?? [];
  const byStatus: Record<string, number> = {};
  for (const row of list) {
    const s = row.status as string;
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }
  return { total: list.length, byStatus };
}

export async function createProject(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("projects").insert({
    tenant_id: tenantId,
    name: String(input.name),
    client_name: String(input.clientName),
    manager_name: input.managerName ? String(input.managerName) : null,
    status: String(input.status ?? "PLANNING"),
    priority: String(input.priority ?? "MEDIUM"),
    start_date: input.startDate || null,
    due_date: input.dueDate || null,
    budget: input.budget != null ? Number(input.budget) : null,
    progress: Number(input.progress ?? 0),
    tags: input.tags ?? [],
    description: input.description ? String(input.description) : null,
  }).select().single();
  if (error) throw error;
  return mapProject(data);
}

export async function updateProject(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.clientName !== undefined) payload.client_name = input.clientName;
  if (input.managerName !== undefined) payload.manager_name = input.managerName || null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.startDate !== undefined) payload.start_date = input.startDate || null;
  if (input.dueDate !== undefined) payload.due_date = input.dueDate || null;
  if (input.budget !== undefined) payload.budget = input.budget;
  if (input.progress !== undefined) payload.progress = input.progress;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.description !== undefined) payload.description = input.description || null;
  const { data, error } = await supabase.from("projects").update(payload).eq("tenant_id", tenantId).eq("id", id).is("deleted_at", null).select().single();
  if (error) throw error;
  return mapProject(data);
}

export async function deleteProject(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("projects").update({ deleted_at: new Date().toISOString() }).eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
  return { id };
}
