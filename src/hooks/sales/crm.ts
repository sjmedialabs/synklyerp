import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import type { CrmApiKeyCreated, CrmForm, CrmLeadSource, CrmWebhook } from "@/lib/mappers/crm";
import type { Lead } from "@/lib/mappers/modules";
import type { CrmLeadActivity, CrmLeadAttribution } from "@/lib/mappers/crm";

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

export function useLeads(search = "", status = "") {
  const params = new URLSearchParams({ limit: "100" });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return useQuery({
    queryKey: ["leads", search, status],
    queryFn: () => getJson<Lead[]>(`/api/sales/leads?${params.toString()}`),
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
