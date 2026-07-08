import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { WhatsAppConfigInput } from "@/validators/whatsapp-config";

export type WhatsAppTenantConfigRecord = {
  tenantId: string;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  accessTokenSet: boolean;
  webhookVerifyToken: string | null;
  isActive: boolean;
  updatedAt: string | null;
};

export async function isWhatsAppSchemaMigrated(): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("crm_whatsapp_tenant_config").select("tenant_id").limit(1);
  if (error && isMissingSchemaError(error)) return false;
  if (error) throw error;
  return true;
}

export async function getWhatsAppTenantConfig(tenantId: string): Promise<WhatsAppTenantConfigRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_whatsapp_tenant_config")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  if (!data) return null;

  return {
    tenantId: data.tenant_id as string,
    phoneNumberId: (data.phone_number_id as string) ?? null,
    businessAccountId: (data.business_account_id as string) ?? null,
    accessTokenSet: !!(data.access_token as string | null),
    webhookVerifyToken: (data.webhook_verify_token as string) ?? null,
    isActive: data.is_active as boolean,
    updatedAt: (data.updated_at as string) ?? null,
  };
}

export async function upsertWhatsAppTenantConfig(
  tenantId: string,
  input: WhatsAppConfigInput & { accessToken?: string }
) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("crm_whatsapp_tenant_config")
    .select("access_token")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    phone_number_id: input.phoneNumberId,
    business_account_id: input.businessAccountId,
    webhook_verify_token: input.webhookVerifyToken,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  if (input.accessToken?.trim()) {
    payload.access_token = input.accessToken.trim();
  } else if (existing?.access_token) {
    payload.access_token = existing.access_token;
  } else {
    payload.access_token = null;
  }

  const { data, error } = await supabase
    .from("crm_whatsapp_tenant_config")
    .upsert(payload, { onConflict: "tenant_id" })
    .select("*")
    .single();
  if (error) {
    if (isMissingSchemaError(error)) throw new Error("SCHEMA_NOT_MIGRATED");
    throw error;
  }

  return {
    tenantId: data.tenant_id as string,
    phoneNumberId: (data.phone_number_id as string) ?? null,
    businessAccountId: (data.business_account_id as string) ?? null,
    accessTokenSet: !!(data.access_token as string | null),
    webhookVerifyToken: (data.webhook_verify_token as string) ?? null,
    isActive: data.is_active as boolean,
    updatedAt: (data.updated_at as string) ?? null,
  };
}
