import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { DograhConfigInput } from "@/validators/dograh-config";
import { parseDograhAgentTriggerUuid } from "@/validators/dograh-config";

export type DograhTenantConfigRecord = {
  tenantId: string;
  serverUrl: string | null;
  apiKeySet: boolean;
  publicAppUrl: string | null;
  agentTriggerUuid: string | null;
  telephonyConfigurationId: number | null;
  isActive: boolean;
  updatedAt: string | null;
};

export type ResolvedDograhCredentials = {
  serverUrl: string;
  apiKey: string;
  publicAppUrl: string;
  agentTriggerUuid: string;
  telephonyConfigurationId: number | null;
  isActive: boolean;
};

function mapConfigRow(data: Record<string, unknown>): DograhTenantConfigRecord {
  return {
    tenantId: data.tenant_id as string,
    serverUrl: (data.server_url as string) ?? null,
    apiKeySet: !!(data.api_key as string | null),
    publicAppUrl: (data.public_app_url as string) ?? null,
    agentTriggerUuid: (data.agent_trigger_uuid as string) ?? null,
    telephonyConfigurationId:
      data.telephony_configuration_id == null ? null : Number(data.telephony_configuration_id),
    isActive: data.is_active as boolean,
    updatedAt: (data.updated_at as string) ?? null,
  };
}

export async function isDograhSchemaMigrated(): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("crm_dograh_tenant_config").select("tenant_id").limit(1);
  if (error && isMissingSchemaError(error)) return false;
  if (error) throw error;
  return true;
}

export async function getDograhTenantConfig(tenantId: string): Promise<DograhTenantConfigRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_dograh_tenant_config")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  if (!data) return null;
  return mapConfigRow(data as Record<string, unknown>);
}

export async function upsertDograhTenantConfig(tenantId: string, input: DograhConfigInput & { apiKey?: string }) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("crm_dograh_tenant_config")
    .select("api_key")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const agentTriggerUuid = parseDograhAgentTriggerUuid(input.agentTriggerUuid) ?? null;

  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    server_url: input.serverUrl.trim() || null,
    public_app_url: input.publicAppUrl.trim() || null,
    agent_trigger_uuid: agentTriggerUuid,
    telephony_configuration_id: input.telephonyConfigurationId ?? null,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  if (input.apiKey?.trim()) {
    payload.api_key = input.apiKey.trim();
  } else if (existing?.api_key) {
    payload.api_key = existing.api_key;
  } else {
    payload.api_key = null;
  }

  const { data, error } = await supabase
    .from("crm_dograh_tenant_config")
    .upsert(payload, { onConflict: "tenant_id" })
    .select("*")
    .single();
  if (error) {
    if (isMissingSchemaError(error)) throw new Error("SCHEMA_NOT_MIGRATED");
    throw error;
  }

  return mapConfigRow(data as Record<string, unknown>);
}

export async function getDograhApiKeyForTenant(tenantId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_dograh_tenant_config")
    .select("api_key")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  return (data?.api_key as string) ?? null;
}

export async function findTenantIdByDograhApiKey(apiKey: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_dograh_tenant_config")
    .select("tenant_id")
    .eq("api_key", apiKey)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  return (data?.tenant_id as string) ?? null;
}

export async function resolveDograhCredentials(tenantId: string): Promise<ResolvedDograhCredentials | null> {
  const config = await getDograhTenantConfig(tenantId);
  const envUrl = process.env.DOGRAH_URL?.trim();
  const envKey = process.env.DOGRAH_API_KEY?.trim();
  const envAgentTriggerUuid = parseDograhAgentTriggerUuid(process.env.DOGRAH_AGENT_TRIGGER_UUID);
  const envTelephonyId = process.env.DOGRAH_TELEPHONY_CONFIGURATION_ID?.trim();
  const envPublic =
    process.env.DOGRAH_APP_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "";

  const serverUrl = config?.serverUrl?.trim() || envUrl || "";
  const storedKey = config?.apiKeySet ? await getDograhApiKeyForTenant(tenantId) : null;
  const apiKey = storedKey?.trim() || envKey || "";
  const publicAppUrl = config?.publicAppUrl?.trim() || envPublic;
  const agentTriggerUuid =
    parseDograhAgentTriggerUuid(config?.agentTriggerUuid) || envAgentTriggerUuid || "";
  const telephonyConfigurationId =
    config?.telephonyConfigurationId ??
    (envTelephonyId && /^\d+$/.test(envTelephonyId) ? Number(envTelephonyId) : null);
  const isActive = config?.isActive ?? false;

  if (!isActive || !serverUrl || !apiKey || !agentTriggerUuid) return null;
  return {
    serverUrl: serverUrl.replace(/\/$/, ""),
    apiKey,
    publicAppUrl: publicAppUrl.replace(/\/$/, ""),
    agentTriggerUuid,
    telephonyConfigurationId,
    isActive,
  };
}
