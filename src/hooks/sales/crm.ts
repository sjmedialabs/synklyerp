import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import type { CrmApiKeyCreated, CrmForm, CrmLeadSource, CrmWebhook } from "@/lib/mappers/crm";
import type { Lead } from "@/lib/mappers/modules";
import type { CrmLeadActivity, CrmLeadAttribution } from "@/lib/mappers/crm";
import type { PaginationMeta } from "@/types/api";
import type { DashboardCounts, LeadStageTab } from "@/lib/sales/lead-stages";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "Request failed");
  return json.data as T;
}

export function useLeadSources(search = "") {
  return useQuery({
    queryKey: ["crm", "lead-sources", search],
    queryFn: () => getJson<CrmLeadSource[]>(`/api/sales/capture/sources?search=${encodeURIComponent(search)}&limit=100`),
  });
}

export function useSourceTypes() {
  return useQuery({
    queryKey: ["crm", "source-types"],
    queryFn: () => getJson<{ code: string; name: string }[]>("/api/sales/capture/source-types"),
    staleTime: 300_000,
  });
}

export function useLeadSourceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["crm", "lead-sources"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<CrmLeadSource>("/api/sales/capture/sources", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<CrmLeadSource>(`/api/sales/capture/sources/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
  };
}

export function useCaptureApiKeys() {
  return useQuery({
    queryKey: ["crm", "api-keys"],
    queryFn: () => getJson<CrmApiKeyCreated[]>(`/api/sales/capture/api-keys?limit=100`),
  });
}

export function useCaptureApiKeyMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["crm", "api-keys"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<CrmApiKeyCreated>("/api/sales/capture/api-keys", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    revoke: useMutation({
      mutationFn: (id: string) =>
        fetchApi(`/api/sales/capture/api-keys/${id}`, { method: "PATCH", body: JSON.stringify({ action: "revoke" }) }),
      onSuccess: invalidate,
    }),
  };
}

export function useCaptureForms() {
  return useQuery({
    queryKey: ["crm", "forms"],
    queryFn: () => getJson<CrmForm[]>(`/api/sales/capture/forms?limit=100`),
  });
}

export function useCaptureWebhooks() {
  return useQuery({
    queryKey: ["crm", "webhooks"],
    queryFn: () => getJson<CrmWebhook[]>(`/api/sales/capture/webhooks?limit=100`),
  });
}

export function useCaptureFormMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["crm", "forms"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<CrmForm>("/api/sales/capture/forms", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
  };
}

export function useCaptureWebhookMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["crm", "webhooks"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi<CrmWebhook>("/api/sales/capture/webhooks", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    test: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/sales/capture/webhooks/${id}`, { method: "POST" }),
    }),
  };
}

export function useLeadDetail(leadId: string) {
  return useQuery({
    queryKey: ["leads", leadId, "detail"],
    queryFn: () =>
      getJson<{ lead: Lead; attribution: CrmLeadAttribution | null; activities: CrmLeadActivity[] }>(
        `/api/sales/leads/${leadId}/detail`
      ),
    enabled: !!leadId,
  });
}

export function useAddLeadNote(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: string) =>
      fetchApi(`/api/sales/leads/${leadId}/activities`, { method: "POST", body: JSON.stringify({ note }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads", leadId, "detail"] }),
  });
}

async function getJsonWithMeta<T>(url: string): Promise<{ data: T; meta?: PaginationMeta }> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "Request failed");
  return { data: json.data as T, meta: json.meta as PaginationMeta | undefined };
}

export type LeadsQuery = {
  search?: string;
  stage?: LeadStageTab;
  status?: string;
  leadType?: string;
  source?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export function useLeadsQuery(params: LeadsQuery) {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 25));
  qs.set("page", String(params.page ?? 1));
  if (params.search) qs.set("search", params.search);
  if (params.stage && params.stage !== "all") qs.set("stage", params.stage);
  if (params.status) qs.set("status", params.status);
  if (params.leadType) qs.set("leadType", params.leadType);
  if (params.source) qs.set("source", params.source);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.sortOrder) qs.set("sortOrder", params.sortOrder);

  return useQuery({
    queryKey: ["leads", params],
    queryFn: () => getJsonWithMeta<Lead[]>(`/api/sales/leads?${qs.toString()}`),
    placeholderData: (prev) => prev,
  });
}

/** @deprecated use useLeadsQuery for paginated lists */
export function useLeads(search = "", status = "") {
  const { data, ...rest } = useLeadsQuery({ search, status: status || undefined, limit: 100 });
  return { data: data?.data ?? [], ...rest };
}

export function useLeadDashboardCounts() {
  return useQuery({
    queryKey: ["leads", "dashboard-counts"],
    queryFn: () => getJson<DashboardCounts>("/api/sales/leads/dashboard-counts"),
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: ["leads", "stats"],
    queryFn: () => getJson<{ total: number; byStatus: Record<string, number> }>("/api/sales/leads/stats"),
  });
}

export function useLeadMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["leads", "stats"] });
    qc.invalidateQueries({ queryKey: ["leads", "dashboard-counts"] });
  };
  return {
    create: useMutation({
      mutationFn: (body: unknown) => fetchApi<Lead>("/api/sales/leads", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi<Lead>(`/api/sales/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => fetchApi(`/api/sales/leads/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

export function useApiLogs(apiKeyId?: string) {
  const q = apiKeyId ? `&apiKeyId=${apiKeyId}` : "";
  return useQuery({
    queryKey: ["crm", "api-logs", apiKeyId],
    queryFn: () =>
      getJson<
        {
          id: string;
          method: string;
          path: string;
          statusCode: number;
          processingMs: number | null;
          errorMessage: string | null;
          ipAddress: string | null;
          createdAt: string;
        }[]
      >(`/api/sales/capture/api-logs?limit=100${q}`),
  });
}

export function useWebhookLogs(webhookId?: string) {
  const q = webhookId ? `?webhookId=${webhookId}` : "";
  return useQuery({
    queryKey: ["crm", "webhook-logs", webhookId],
    queryFn: () =>
      getJson<
        {
          id: string;
          webhookId: string;
          eventType: string;
          responseStatus: number | null;
          errorMessage: string | null;
          attempt: number;
          deliveredAt: string | null;
          createdAt: string;
        }[]
      >(`/api/sales/capture/webhook-logs${q}`),
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["crm", "campaigns"],
    queryFn: () =>
      getJson<
        {
          id: string;
          name: string;
          code: string;
          channel: string | null;
          status: string;
          budget: number | null;
          spend: number;
          leadCount: number;
          totalCost: number;
        }[]
      >("/api/sales/capture/campaigns"),
  });
}

export function useCampaignMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["crm", "campaigns"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi("/api/sales/capture/campaigns", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi(`/api/sales/capture/campaigns/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
  };
}

export function useCampaignAttributions(campaignId?: string) {
  const q = campaignId ? `&campaignId=${campaignId}` : "";
  return useQuery({
    queryKey: ["crm", "campaign-attributions", campaignId],
    queryFn: () =>
      getJson<
        {
          id: string;
          leadId: string;
          campaign: string | null;
          channel: string | null;
          cost: number | null;
          createdAt: string;
          lead: { name: string; email: string | null; company: string | null } | null;
        }[]
      >(`/api/sales/capture/campaigns/attributions?limit=100${q}`),
  });
}

export function useMessageTemplates(seed = false) {
  return useQuery({
    queryKey: ["crm", "templates", seed],
    queryFn: () =>
      getJson<
        {
          id: string;
          name: string;
          channel: string;
          subject: string | null;
          bodyText: string;
          status: string;
        }[]
      >(`/api/sales/capture/communication/templates${seed ? "?seed=1" : ""}`),
  });
}

export function useTemplateMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["crm", "templates"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi("/api/sales/capture/communication/templates", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        fetchApi(`/api/sales/capture/communication/templates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
  };
}

export function useCommunicationSequences() {
  return useQuery({
    queryKey: ["crm", "sequences"],
    queryFn: () =>
      getJson<
        {
          id: string;
          name: string;
          triggerEvent: string;
          status: string;
          steps: { templateName?: string; delayMinutes: number }[];
        }[]
      >("/api/sales/capture/communication/sequences"),
  });
}

export function useSequenceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["crm", "sequences"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) =>
        fetchApi("/api/sales/capture/communication/sequences", { method: "POST", body: JSON.stringify(body) }),
      onSuccess: invalidate,
    }),
  };
}

export function useCommunicationLogs() {
  return useQuery({
    queryKey: ["crm", "comm-logs"],
    queryFn: () =>
      getJson<
        {
          id: string;
          channel: string;
          recipient: string;
          subject: string | null;
          status: string;
          errorMessage: string | null;
          sentAt: string | null;
          createdAt: string;
        }[]
      >("/api/sales/capture/communication/logs?limit=100"),
  });
}

export type LeadEngagementSummary = {
  counts: Record<"call" | "sms" | "email" | "whatsapp", number>;
  history: {
    id: string;
    channel: "call" | "sms" | "email" | "whatsapp";
    action: string;
    userId: string | null;
    createdAt: string;
  }[];
};

export function useLeadEngagements(leadId: string) {
  return useQuery({
    queryKey: ["leads", leadId, "engagements"],
    queryFn: () => getJson<LeadEngagementSummary>(`/api/sales/leads/${leadId}/engagements`),
    enabled: !!leadId,
  });
}

export function useLogLeadEngagement(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { channel: "call" | "sms" | "email" | "whatsapp"; action?: string }) =>
      fetchApi(`/api/sales/leads/${leadId}/engagements`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads", leadId, "engagements"] }),
  });
}

export type WhatsAppChatData = {
  conversation: {
    id: string;
    leadId: string;
    phone: string;
    status: string;
    aiMode: string;
    summary: string | null;
    lastMessageAt: string | null;
  };
  messages: {
    id: string;
    direction: "inbound" | "outbound";
    body: string;
    senderType: string;
    createdAt: string;
    externalId: string | null;
    delivered: boolean;
  }[];
  config: { is_active: boolean; phone_number_id: string | null; business_account_id: string | null } | null;
};

export function useWhatsAppChat(leadId: string, enabled = true) {
  return useQuery({
    queryKey: ["leads", leadId, "whatsapp"],
    queryFn: () => getJson<WhatsAppChatData>(`/api/sales/leads/${leadId}/whatsapp`),
    enabled: !!leadId && enabled,
    refetchInterval: enabled ? 15_000 : false,
  });
}

export function useWhatsAppMutations(leadId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["leads", leadId, "whatsapp"] });
  return {
    validate: useMutation({
      mutationFn: (phone: string) =>
        fetchApi<{ normalized: string; display: string; verified: boolean }>(`/api/sales/leads/${leadId}/whatsapp`, {
          method: "POST",
          body: JSON.stringify({ action: "validate", phone }),
        }),
    }),
    send: useMutation({
      mutationFn: (message: string) =>
        fetchApi(`/api/sales/leads/${leadId}/whatsapp`, { method: "POST", body: JSON.stringify({ message }) }),
      onSuccess: invalidate,
    }),
    summarize: useMutation({
      mutationFn: () =>
        fetchApi<{ summary: string }>(`/api/sales/leads/${leadId}/whatsapp`, {
          method: "POST",
          body: JSON.stringify({ action: "summarize" }),
        }),
      onSuccess: invalidate,
    }),
  };
}

export function useDograhCall(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi<{ callId: string | null; phone: string }>("/api/dograh/create-call", {
        method: "POST",
        body: JSON.stringify({ leadId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads", leadId] });
      qc.invalidateQueries({ queryKey: ["leads", leadId, "engagements"] });
      qc.invalidateQueries({ queryKey: ["leads", leadId, "detail"] });
    },
  });
}

export type CommunicationHistoryQuery = {
  channel?: string;
  search?: string;
  assignedTo?: string;
  leadId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export function useCommunicationHistory(params: CommunicationHistoryQuery) {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 30));
  qs.set("page", String(params.page ?? 1));
  if (params.channel && params.channel !== "all") qs.set("channel", params.channel);
  if (params.search) qs.set("search", params.search);
  if (params.assignedTo) qs.set("assignedTo", params.assignedTo);
  if (params.leadId) qs.set("leadId", params.leadId);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  if (params.sortOrder) qs.set("sortOrder", params.sortOrder);

  return useQuery({
    queryKey: ["communication-history", params],
    queryFn: () =>
      getJsonWithMeta<import("@/repositories/sales/crm/communication-history").CommunicationHistoryItem[]>(
        `/api/sales/leads/communication-history?${qs.toString()}`
      ),
    placeholderData: (prev) => prev,
  });
}
