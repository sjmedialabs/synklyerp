import type { Lead } from "@/lib/mappers/modules";
import { statusLabel } from "@/lib/sales/lead-stages";
import { resolveDograhCredentials } from "@/repositories/sales/crm/dograh-config";

export type DograhCallMetadata = {
  tenantId: string;
  leadId: string;
};

export type DograhCreateCallInput = {
  tenantId: string;
  phone: string;
  metadata: DograhCallMetadata;
  contextUrl: string;
  webhookUrl: string;
};

export type DograhCreateCallResult = {
  callId: string | null;
  raw: unknown;
};

export type DograhCredentialTestResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function isDograhConfigured(tenantId: string) {
  const creds = await resolveDograhCredentials(tenantId);
  return !!creds;
}

export function buildDograhCustomerContext(
  lead: Lead,
  lastCallSummary?: string | null
): Record<string, string | null> {
  return {
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

export async function testDograhCredentials(input: {
  tenantId: string;
  serverUrl?: string;
  apiKey?: string;
}): Promise<DograhCredentialTestResult> {
  const resolved = await resolveDograhCredentials(input.tenantId);
  const serverUrl = (
    input.serverUrl?.trim() ||
    resolved?.serverUrl ||
    process.env.DOGRAH_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  const apiKey = input.apiKey?.trim() || resolved?.apiKey || process.env.DOGRAH_API_KEY?.trim() || "";

  if (!serverUrl) return { ok: false, message: "Dograh server URL is required." };
  if (!apiKey) return { ok: false, message: "Dograh API key is required." };

  const healthPaths = ["/api/health", "/health", "/"];
  for (const path of healthPaths) {
    try {
      const res = await fetch(`${serverUrl}${path}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok || res.status === 404) {
        return { ok: true, message: `Connected to Dograh at ${serverUrl}` };
      }
      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: "Dograh rejected the API key. Check your credentials." };
      }
    } catch {
      /* try next path */
    }
  }

  return {
    ok: false,
    message: `Could not reach Dograh server at ${serverUrl}. Ensure the server is running and reachable.`,
  };
}

export async function createDograhCall(input: DograhCreateCallInput): Promise<DograhCreateCallResult> {
  const creds = await resolveDograhCredentials(input.tenantId);
  if (!creds) {
    throw new Error(
      "Dograh AI Voice is not configured. Enable it under Organisation Setup → Dograh AI Voice."
    );
  }

  const res = await fetch(`${creds.serverUrl}/api/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: input.phone.replace(/\D/g, ""),
      metadata: input.metadata,
      context_url: input.contextUrl,
      webhook_url: input.webhookUrl,
    }),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (raw as { error?: string; message?: string }).error ??
      (raw as { message?: string }).message ??
      `Dograh API returned ${res.status}`;
    throw new Error(message);
  }

  const callId =
    (raw as { callId?: string; id?: string; call_id?: string }).callId ??
    (raw as { id?: string }).id ??
    (raw as { call_id?: string }).call_id ??
    null;

  return { callId, raw };
}
