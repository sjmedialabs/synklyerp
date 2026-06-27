export type CrmLeadSource = {
  id: string;
  tenantId: string;
  sourceTypeCode: string;
  name: string;
  description: string | null;
  status: string;
  authType: string;
  webhookUrl: string | null;
  rateLimitPerMinute: number;
  healthStatus: string;
  totalLeads: number;
  successfulRequests: number;
  failedRequests: number;
  lastSyncAt: string | null;
  config: Record<string, unknown>;
  headers: Record<string, string>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrmApiKey = {
  id: string;
  tenantId: string;
  leadSourceId: string | null;
  name: string;
  keyPrefix: string;
  authMethod: string;
  allowedDomains: string[];
  allowedIps: string[];
  rateLimitPerMinute: number;
  apiVersion: string;
  status: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type CrmApiKeyCreated = CrmApiKey & { apiKey: string; apiSecret: string };

export type CrmLeadAttribution = {
  id: string;
  leadId: string;
  capturedFrom: string | null;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landingPage: string | null;
  referrerUrl: string | null;
  ipAddress: string | null;
  device: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  language: string | null;
  channel: string | null;
  captureTime: string;
};

export type CrmLeadActivity = {
  id: string;
  leadId: string;
  activityType: string;
  title: string;
  description: string | null;
  actorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CrmForm = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: string;
  category: string | null;
  embedToken: string;
  leadSourceId: string | null;
  successMessage: string | null;
  redirectUrl: string | null;
  spamProtection: string;
  viewCount: number;
  submissionCount: number;
  spamCount: number;
  lastSubmissionAt: string | null;
  campaign: string | null;
  leadSourceLabel: string | null;
  createdAt: string;
};

export type CrmWebhook = {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  events: string[];
  payloadFormat: string;
  retryPolicy: string;
  status: string;
  headers?: Record<string, string>;
  createdAt: string;
};

export function mapCrmLeadSource(row: Record<string, unknown>): CrmLeadSource {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    sourceTypeCode: row.source_type_code as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    status: row.status as string,
    authType: row.auth_type as string,
    webhookUrl: (row.webhook_url as string) ?? null,
    rateLimitPerMinute: Number(row.rate_limit_per_minute ?? 60),
    healthStatus: row.health_status as string,
    totalLeads: Number(row.total_leads ?? 0),
    successfulRequests: Number(row.successful_requests ?? 0),
    failedRequests: Number(row.failed_requests ?? 0),
    lastSyncAt: (row.last_sync_at as string) ?? null,
    config: (row.config as Record<string, unknown>) ?? {},
    headers: (row.headers as Record<string, string>) ?? {},
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapCrmApiKey(row: Record<string, unknown>): CrmApiKey {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    leadSourceId: (row.lead_source_id as string) ?? null,
    name: row.name as string,
    keyPrefix: row.key_prefix as string,
    authMethod: row.auth_method as string,
    allowedDomains: (row.allowed_domains as string[]) ?? [],
    allowedIps: (row.allowed_ips as string[]) ?? [],
    rateLimitPerMinute: Number(row.rate_limit_per_minute ?? 120),
    apiVersion: row.api_version as string,
    status: row.status as string,
    lastUsedAt: (row.last_used_at as string) ?? null,
    expiresAt: (row.expires_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapCrmLeadAttribution(row: Record<string, unknown>): CrmLeadAttribution {
  return {
    id: row.id as string,
    leadId: row.lead_id as string,
    capturedFrom: (row.captured_from as string) ?? null,
    campaign: (row.campaign as string) ?? null,
    utmSource: (row.utm_source as string) ?? null,
    utmMedium: (row.utm_medium as string) ?? null,
    utmCampaign: (row.utm_campaign as string) ?? null,
    utmContent: (row.utm_content as string) ?? null,
    utmTerm: (row.utm_term as string) ?? null,
    landingPage: (row.landing_page as string) ?? null,
    referrerUrl: (row.referrer_url as string) ?? null,
    ipAddress: (row.ip_address as string) ?? null,
    device: (row.device as string) ?? null,
    browser: (row.browser as string) ?? null,
    country: (row.country as string) ?? null,
    city: (row.city as string) ?? null,
    timezone: (row.timezone as string) ?? null,
    language: (row.language as string) ?? null,
    channel: (row.channel as string) ?? null,
    captureTime: row.capture_time as string,
  };
}

export function mapCrmLeadActivity(row: Record<string, unknown>): CrmLeadActivity {
  return {
    id: row.id as string,
    leadId: row.lead_id as string,
    activityType: row.activity_type as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    actorId: (row.actor_id as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

export function mapCrmForm(row: Record<string, unknown>): CrmForm {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    status: row.status as string,
    category: (row.category as string) ?? null,
    embedToken: row.embed_token as string,
    leadSourceId: (row.lead_source_id as string) ?? null,
    successMessage: (row.success_message as string) ?? null,
    redirectUrl: (row.redirect_url as string) ?? null,
    spamProtection: String(row.spam_protection ?? "none"),
    viewCount: Number(row.view_count ?? 0),
    submissionCount: Number(row.submission_count ?? 0),
    spamCount: Number(row.spam_count ?? 0),
    lastSubmissionAt: (row.last_submission_at as string) ?? null,
    campaign: (row.campaign as string) ?? null,
    leadSourceLabel: (row.lead_source_label as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapCrmWebhook(row: Record<string, unknown>): CrmWebhook {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    url: row.url as string,
    events: (row.events as string[]) ?? [],
    payloadFormat: row.payload_format as string,
    retryPolicy: row.retry_policy as string,
    status: row.status as string,
    headers: (row.headers as Record<string, string>) ?? {},
    createdAt: row.created_at as string,
  };
}
