import type { Lead } from "@/lib/mappers/modules";
import { statusLabel } from "@/lib/sales/lead-stages";
import { resolveDograhCredentials } from "@/repositories/sales/crm/dograh-config";
import { parseDograhAgentTriggerUuid } from "@/validators/dograh-config";

export type DograhCreateCallInput = {
  tenantId: string;
  phoneE164: string;
  leadId: string;
  initialContext: Record<string, string | null>;
  telephonyConfigurationId?: number | null;
};

export type DograhCreateCallResult = {
  callId: string | null;
  workflowRunId: number | null;
  raw: unknown;
};

export type DograhCredentialTestResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export type NormalizedDograhWebhookPayload = {
  phone: string;
  tenantId?: string;
  leadId?: string;
  callId?: string;
  status?: string;
  summary?: string;
  visitDate?: string;
  transcript?: string;
  duration?: number;
  recording?: string | null;
};

export function formatPhoneForDograh(normalizedDigits: string): string {
  const digits = normalizedDigits.replace(/\D/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export async function isDograhConfigured(tenantId: string) {
  const creds = await resolveDograhCredentials(tenantId);
  return !!creds;
}

export function buildDograhCustomerContext(
  lead: Lead,
  lastCallSummary?: string | null
): Record<string, string | null> {
  return {
    tenantId: lead.tenantId ?? null,
    leadId: lead.id,
    name: lead.name,
    city: lead.city ?? lead.company,
    budget: lead.budget,
    project: lead.projectInterest ?? lead.service?.name ?? null,
    lastCall: lastCallSummary ?? lead.aiSummary ?? null,
    assignedAgent: lead.assignee?.name ?? null,
    status: statusLabel(lead.status),
    phone: lead.phone,
    source: lead.source,
    email: lead.email,
    company: lead.company,
  };
}

const DOGRAH_STATUS_MAP: Record<string, string> = {
  interested: "PROSPECT",
  "not interested": "DROPPED",
  callback: "PROSPECT",
  converted: "CONVERTED",
  negotiation: "NEGOTIATION",
  proposal: "PROPOSAL_SENT",
};

export function mapDograhStatusToLead(status: string | undefined | null): string | null {
  if (!status?.trim()) return null;
  const key = status.trim().toLowerCase();
  if (DOGRAH_STATUS_MAP[key]) return DOGRAH_STATUS_MAP[key];
  const upper = status.trim().toUpperCase().replace(/\s+/g, "_");
  const valid = ["FRESH_LEAD", "PROSPECT", "PROPOSAL_SENT", "NEGOTIATION", "CONVERTED", "DROPPED"];
  return valid.includes(upper) ? upper : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function pickDuration(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) return Math.trunc(value);
    if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  }
  return undefined;
}

export function extractDograhPreCallPhone(body: Record<string, unknown>): string | undefined {
  const inbound = asRecord(body.call_inbound);
  const initial = asRecord(body.initial_context);
  return pickString(
    inbound?.to_number,
    inbound?.from_number,
    body.phone_number,
    body.phone,
    initial?.phone,
    initial?.phone_number
  );
}

export function extractDograhPreCallIds(body: Record<string, unknown>) {
  const initial = asRecord(body.initial_context);
  return {
    tenantId: pickString(body.tenantId, initial?.tenantId),
    leadId: pickString(body.leadId, initial?.leadId),
  };
}

export function normalizeDograhWebhookPayload(body: Record<string, unknown>): NormalizedDograhWebhookPayload | null {
  const initial = asRecord(body.initial_context);
  const gathered = asRecord(body.gathered_context);
  const costInfo = asRecord(body.cost_info);

  const phone = pickString(
    body.phone,
    initial?.phone,
    initial?.phone_number,
    body.phone_number
  );
  if (!phone) return null;

  const duration = pickDuration(
    body.duration,
    costInfo?.call_duration_seconds,
    gathered?.duration,
    gathered?.call_duration_seconds
  );

  return {
    phone,
    tenantId: pickString(body.tenantId, initial?.tenantId),
    leadId: pickString(body.leadId, initial?.leadId),
    callId: pickString(body.callId, body.workflow_run_id, body.run_id, body.call_id),
    status: pickString(body.status, gathered?.status, gathered?.outcome, gathered?.call_disposition),
    summary: pickString(body.summary, gathered?.summary, gathered?.call_summary),
    visitDate: pickString(body.visitDate, gathered?.visit_date, gathered?.visitDate),
    transcript: pickString(body.transcript, body.transcript_url),
    duration,
    recording: pickString(body.recording, body.recording_url) ?? null,
  };
}

export async function testDograhCredentials(input: {
  tenantId: string;
  serverUrl?: string;
  apiKey?: string;
  agentTriggerUuid?: string;
}): Promise<DograhCredentialTestResult> {
  const resolved = await resolveDograhCredentials(input.tenantId);
  const serverUrl = (
    input.serverUrl?.trim() ||
    resolved?.serverUrl ||
    process.env.DOGRAH_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  const apiKey = input.apiKey?.trim() || resolved?.apiKey || process.env.DOGRAH_API_KEY?.trim() || "";
  const agentTriggerUuid =
    parseDograhAgentTriggerUuid(input.agentTriggerUuid) ||
    parseDograhAgentTriggerUuid(resolved?.agentTriggerUuid) ||
    parseDograhAgentTriggerUuid(process.env.DOGRAH_AGENT_TRIGGER_UUID);

  if (!serverUrl) return { ok: false, message: "Dograh server URL is required." };
  if (!apiKey) return { ok: false, message: "Dograh API key is required." };

  try {
    const res = await fetch(`${serverUrl}/api/v1/health`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { ok: false, message: `Dograh health check failed (${res.status}).` };
    }
  } catch {
    return {
      ok: false,
      message: `Could not reach Dograh server at ${serverUrl}. Ensure the server is running and reachable.`,
    };
  }

  if (!agentTriggerUuid) {
    return {
      ok: true,
      message: `Connected to Dograh at ${serverUrl}. Add the API Trigger UUID to enable outbound calls.`,
    };
  }

  return {
    ok: true,
    message: `Connected to Dograh at ${serverUrl}. Agent trigger ${agentTriggerUuid} is configured.`,
  };
}

export async function createDograhCall(input: DograhCreateCallInput): Promise<DograhCreateCallResult> {
  const creds = await resolveDograhCredentials(input.tenantId);
  if (!creds) {
    throw new Error(
      "Dograh AI Voice is not configured. Enable it under Organisation Setup → Dograh AI Voice."
    );
  }

  const phoneNumber = formatPhoneForDograh(input.phoneE164);
  const telephonyConfigurationId =
    input.telephonyConfigurationId ?? creds.telephonyConfigurationId ?? undefined;

  const requestBody: Record<string, unknown> = {
    phone_number: phoneNumber,
    initial_context: {
      ...input.initialContext,
      tenantId: input.tenantId,
      leadId: input.leadId,
      phone: phoneNumber,
    },
  };

  if (telephonyConfigurationId != null) {
    requestBody.telephony_configuration_id = telephonyConfigurationId;
  }

  const res = await fetch(`${creds.serverUrl}/api/v1/public/agent/${creds.agentTriggerUuid}`, {
    method: "POST",
    headers: {
      "X-API-Key": creds.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (raw as { detail?: string | { msg?: string }[] }).detail;
    const message =
      (typeof detail === "string" ? detail : undefined) ??
      (Array.isArray(detail) ? detail.map((item) => item.msg).filter(Boolean).join("; ") : undefined) ??
      (raw as { error?: string; message?: string }).error ??
      (raw as { message?: string }).message ??
      `Dograh API returned ${res.status}`;
    throw new Error(message);
  }

  const workflowRunId =
    typeof (raw as { workflow_run_id?: unknown }).workflow_run_id === "number"
      ? (raw as { workflow_run_id: number }).workflow_run_id
      : null;

  const callId =
    workflowRunId != null
      ? String(workflowRunId)
      : pickString(
          (raw as { callId?: string }).callId,
          (raw as { id?: string }).id,
          (raw as { call_id?: string }).call_id
        ) ?? null;

  return { callId, workflowRunId, raw };
}

export const DOGRAH_WEBHOOK_PAYLOAD_TEMPLATE = `{
  "phone": "{{initial_context.phone}}",
  "tenantId": "{{initial_context.tenantId}}",
  "leadId": "{{initial_context.leadId}}",
  "callId": "{{workflow_run_id}}",
  "status": "{{gathered_context.call_disposition}}",
  "summary": "{{gathered_context.summary}}",
  "duration": "{{cost_info.call_duration_seconds}}",
  "recording": "{{recording_url}}",
  "transcript": "{{transcript_url}}"
}`;
