import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { EngagementChannel } from "@/repositories/sales/crm/engagement";

export type CommunicationChannel = EngagementChannel | "all";
export type CommunicationHistoryChannel = EngagementChannel;

export type CommunicationHistoryItem = {
  id: string;
  source: "engagement" | "whatsapp" | "ai_call";
  channel: CommunicationHistoryChannel;
  action: string;
  detail: string | null;
  direction: "inbound" | "outbound" | null;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  leadId: string;
  leadName: string;
  leadCompany: string | null;
  leadPhone: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
};

export type ListCommunicationHistoryParams = {
  channel?: CommunicationChannel;
  assignedTo?: string;
  leadId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortOrder?: "asc" | "desc";
};

const ENGAGEMENT_SELECT = `
  id, channel, action, created_at, user_id, metadata,
  leads:lead_id (
    id, name, company, phone, assigned_to,
    assignee:assigned_to ( id, name )
  ),
  performer:user_id ( id, name )
`;

export async function listCommunicationHistory(tenantId: string, params: ListCommunicationHistoryParams) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 30, 100);
  const sortOrder = params.sortOrder ?? "desc";

  const engagementItems = await fetchEngagements(tenantId, params);
  const includeWhatsApp = !params.channel || params.channel === "all" || params.channel === "whatsapp";
  const includeCalls = !params.channel || params.channel === "all" || params.channel === "call";
  const whatsappItems = includeWhatsApp ? await fetchWhatsAppMessages(tenantId, params) : [];
  const callItems = includeCalls ? await fetchCallLogs(tenantId, params) : [];

  let items = [...engagementItems, ...whatsappItems, ...callItems];
  if (params.channel && params.channel !== "all") {
    items = items.filter((i) => i.channel === params.channel);
  }

  items.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return sortOrder === "asc" ? ta - tb : tb - ta;
  });

  const total = items.length;
  const from = (page - 1) * limit;
  const paged = items.slice(from, from + limit);

  return { items: paged, total, page, limit };
}

async function fetchEngagements(tenantId: string, params: ListCommunicationHistoryParams) {
  const supabase = createAdminClient();
  let query = supabase
    .from("crm_lead_engagements")
    .select(ENGAGEMENT_SELECT)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: params.sortOrder === "asc" });

  if (params.channel && params.channel !== "all" && params.channel !== "whatsapp") {
    query = query.eq("channel", params.channel);
  }
  if (params.leadId) query = query.eq("lead_id", params.leadId);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);

  const { data, error } = await query.limit(500);
  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  return (data ?? [])
    .map(mapEngagementRow)
    .filter((row) => matchesLeadFilters(row, params));
}

async function fetchWhatsAppMessages(tenantId: string, params: ListCommunicationHistoryParams) {
  const supabase = createAdminClient();
  let query = supabase
    .from("crm_whatsapp_messages")
    .select(
      `
      id, direction, body, sender_type, created_at,
      conversation:conversation_id (
        lead_id,
        leads:lead_id (
          id, name, company, phone, assigned_to,
          assignee:assigned_to ( id, name )
        )
      )
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: params.sortOrder === "asc" });

  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);

  const { data, error } = await query.limit(500);
  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  return (data ?? [])
    .map(mapWhatsAppRow)
    .filter((row): row is CommunicationHistoryItem => row !== null)
    .filter((row) => {
      if (params.leadId && row.leadId !== params.leadId) return false;
      return matchesLeadFilters(row, params);
    });
}

function matchesLeadFilters(row: CommunicationHistoryItem, params: ListCommunicationHistoryParams) {
  if (params.assignedTo && row.assignedTo !== params.assignedTo) return false;
  if (params.search) {
    const q = params.search.toLowerCase();
    const hay = [row.leadName, row.leadCompany, row.leadPhone, row.detail]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function mapEngagementRow(row: Record<string, unknown>): CommunicationHistoryItem {
  const lead = row.leads as Record<string, unknown> | null;
  const assignee = lead?.assignee as { id: string; name: string } | null;
  const performer = row.performer as { id: string; name: string } | null;
  const metadata = (row.metadata as Record<string, unknown>) ?? {};

  return {
    id: `eng-${row.id as string}`,
    source: "engagement",
    channel: row.channel as CommunicationHistoryChannel,
    action: row.action as string,
    detail: (metadata.preview as string) ?? null,
    direction: null,
    createdAt: row.created_at as string,
    userId: (row.user_id as string) ?? null,
    userName: performer?.name ?? null,
    leadId: (lead?.id as string) ?? "",
    leadName: (lead?.name as string) ?? "Unknown",
    leadCompany: (lead?.company as string) ?? null,
    leadPhone: (lead?.phone as string) ?? null,
    assignedTo: (lead?.assigned_to as string) ?? null,
    assigneeName: assignee?.name ?? null,
  };
}

function mapWhatsAppRow(row: Record<string, unknown>): CommunicationHistoryItem | null {
  const conv = row.conversation as Record<string, unknown> | null;
  const lead = conv?.leads as Record<string, unknown> | null;
  if (!lead?.id) return null;

  const assignee = lead.assignee as { id: string; name: string } | null;
  const direction = row.direction as "inbound" | "outbound";
  const senderType = row.sender_type as string;

  return {
    id: `wa-${row.id as string}`,
    source: "whatsapp",
    channel: "whatsapp",
    action: direction === "inbound" ? "message_received" : senderType === "ai" ? "ai_reply" : "message_sent",
    detail: row.body as string,
    direction,
    createdAt: row.created_at as string,
    userId: null,
    userName: senderType === "ai" ? "AI" : direction === "inbound" ? "Lead" : "Team",
    leadId: lead.id as string,
    leadName: lead.name as string,
    leadCompany: (lead.company as string) ?? null,
    leadPhone: (lead.phone as string) ?? null,
    assignedTo: (lead.assigned_to as string) ?? null,
    assigneeName: assignee?.name ?? null,
  };
}

async function fetchCallLogs(tenantId: string, params: ListCommunicationHistoryParams) {
  const supabase = createAdminClient();
  let query = supabase
    .from("crm_call_logs")
    .select(
      `
      id, status, summary, transcript, duration_seconds, created_at,
      leads:lead_id (
        id, name, company, phone, assigned_to,
        assignee:assigned_to ( id, name )
      )
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: params.sortOrder === "asc" });

  if (params.leadId) query = query.eq("lead_id", params.leadId);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);

  const { data, error } = await query.limit(500);
  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  return (data ?? [])
    .map(mapCallLogRow)
    .filter((row) => matchesLeadFilters(row, params));
}

function mapCallLogRow(row: Record<string, unknown>): CommunicationHistoryItem {
  const lead = row.leads as Record<string, unknown> | null;
  const assignee = lead?.assignee as { id: string; name: string } | null;
  const summary = (row.summary as string) ?? null;

  return {
    id: `call-${row.id as string}`,
    source: "ai_call",
    channel: "call",
    action: "ai_call_completed",
    detail: summary ?? (row.transcript as string)?.slice(0, 120) ?? null,
    direction: "outbound",
    createdAt: row.created_at as string,
    userId: null,
    userName: "Dograh AI",
    leadId: (lead?.id as string) ?? "",
    leadName: (lead?.name as string) ?? "Unknown",
    leadCompany: (lead?.company as string) ?? null,
    leadPhone: (lead?.phone as string) ?? null,
    assignedTo: (lead?.assigned_to as string) ?? null,
    assigneeName: assignee?.name ?? null,
  };
}
