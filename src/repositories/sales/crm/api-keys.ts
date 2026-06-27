import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiKeyPair, hashApiSecret, verifyApiSecret } from "@/lib/crm/api-key-auth";
import { mapCrmApiKey, type CrmApiKeyCreated } from "@/lib/mappers/crm";
import type { PaginatedQuery } from "@/types/api";

export async function listApiKeys(tenantId: string, params: PaginatedQuery) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;

  let query = supabase
    .from("crm_api_keys")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.search) query = query.ilike("name", `%${params.search}%`);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  return { items: (data ?? []).map(mapCrmApiKey), total: count ?? 0, page, limit };
}

export async function createApiKey(tenantId: string, userId: string | null, input: Record<string, unknown>): Promise<CrmApiKeyCreated> {
  const { apiKey, keyPrefix } = generateApiKeyPair();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_api_keys")
    .insert({
      tenant_id: tenantId,
      lead_source_id: input.leadSourceId || null,
      name: String(input.name),
      key_prefix: keyPrefix,
      secret_hash: hashApiSecret(apiKey),
      auth_method: String(input.authMethod ?? "bearer"),
      allowed_domains: input.allowedDomains ?? [],
      allowed_ips: input.allowedIps ?? [],
      rate_limit_per_minute: input.rateLimitPerMinute ?? 120,
      expires_at: input.expiresAt ?? null,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return { ...mapCrmApiKey(data), apiKey, apiSecret: apiKey };
}

export async function revokeApiKey(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_api_keys")
    .update({ status: "REVOKED", updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapCrmApiKey(data);
}

export async function resolveApiKeyByToken(token: string) {
  const prefix = token.slice(0, 16);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_api_keys")
    .select("*")
    .eq("key_prefix", prefix)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (!verifyApiSecret(token, data.secret_hash as string)) return null;
  if (data.expires_at && new Date(data.expires_at as string) < new Date()) return null;
  return mapCrmApiKey(data);
}

export async function touchApiKeyUsed(id: string) {
  const supabase = createAdminClient();
  await supabase.from("crm_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", id);
}

export async function logApiRequest(input: {
  tenantId: string;
  apiKeyId?: string | null;
  leadSourceId?: string | null;
  method: string;
  path: string;
  statusCode: number;
  processingMs?: number;
  requestHeaders?: Record<string, unknown>;
  requestPayload?: unknown;
  responsePayload?: unknown;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  idempotencyKey?: string;
}) {
  const supabase = createAdminClient();
  await supabase.from("crm_api_logs").insert({
    tenant_id: input.tenantId,
    api_key_id: input.apiKeyId ?? null,
    lead_source_id: input.leadSourceId ?? null,
    method: input.method,
    path: input.path,
    status_code: input.statusCode,
    processing_ms: input.processingMs ?? null,
    request_headers: input.requestHeaders ?? {},
    request_payload: input.requestPayload ?? null,
    response_payload: input.responsePayload ?? null,
    error_message: input.errorMessage ?? null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
    idempotency_key: input.idempotencyKey ?? null,
  });
}

export async function listApiLogs(tenantId: string, params: PaginatedQuery & { apiKeyId?: string }) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;

  let query = supabase
    .from("crm_api_logs")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (params.apiKeyId) query = query.eq("api_key_id", params.apiKeyId);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error) throw error;
  const items = (data ?? []).map((row) => ({
    id: row.id as string,
    method: row.method as string,
    path: row.path as string,
    statusCode: Number(row.status_code),
    processingMs: row.processing_ms != null ? Number(row.processing_ms) : null,
    errorMessage: (row.error_message as string) ?? null,
    ipAddress: (row.ip_address as string) ?? null,
    createdAt: row.created_at as string,
  }));
  return { items, total: count ?? 0, page, limit };
}
