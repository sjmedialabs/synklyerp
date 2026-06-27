import { createAdminClient } from "@/lib/supabase/admin";

export type DuplicateQueueItem = {
  id: string;
  tenantId: string;
  incomingPayload: Record<string, unknown>;
  matchedLeadId: string | null;
  matchFields: string[];
  status: string;
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): DuplicateQueueItem {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    incomingPayload: (row.incoming_payload as Record<string, unknown>) ?? {},
    matchedLeadId: (row.matched_lead_id as string) ?? null,
    matchFields: (row.match_fields as string[]) ?? [],
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

export async function findDuplicateLead(
  tenantId: string,
  input: { email?: string; phone?: string; company?: string }
) {
  const supabase = createAdminClient();
  const matchFields: string[] = [];
  let matchedId: string | null = null;

  if (input.email) {
    const { data } = await supabase
      .from("leads")
      .select("id")
      .eq("tenant_id", tenantId)
      .ilike("email", input.email)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (data?.id) {
      matchedId = data.id as string;
      matchFields.push("email");
    }
  }

  if (!matchedId && input.phone) {
    const normalized = input.phone.replace(/\D/g, "");
    const { data } = await supabase
      .from("leads")
      .select("id, phone")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);
    const hit = (data ?? []).find((r) => (r.phone as string)?.replace(/\D/g, "") === normalized);
    if (hit?.id) {
      matchedId = hit.id as string;
      matchFields.push("phone");
    }
  }

  if (!matchedId && input.company) {
    const { data } = await supabase
      .from("leads")
      .select("id")
      .eq("tenant_id", tenantId)
      .ilike("company", input.company)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (data?.id) {
      matchedId = data.id as string;
      matchFields.push("company");
    }
  }

  return matchedId ? { matchedLeadId: matchedId, matchFields } : null;
}

export async function enqueueDuplicate(
  tenantId: string,
  payload: Record<string, unknown>,
  matchedLeadId: string,
  matchFields: string[]
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_duplicate_queue")
    .insert({
      tenant_id: tenantId,
      incoming_payload: payload,
      matched_lead_id: matchedLeadId,
      match_fields: matchFields,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function listDuplicateQueue(tenantId: string, status = "pending") {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_duplicate_queue")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function resolveDuplicate(
  tenantId: string,
  id: string,
  status: "merged" | "ignored" | "created",
  resolvedBy: string
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_duplicate_queue")
    .update({ status, resolved_by: resolvedBy, resolved_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data);
}
