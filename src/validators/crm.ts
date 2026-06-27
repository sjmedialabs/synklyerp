import { z } from "zod";

export const LEAD_SOURCE_STATUSES = ["ACTIVE", "INACTIVE", "PAUSED"] as const;
export const CRM_AUTH_TYPES = ["none", "api_key", "bearer", "basic", "hmac", "oauth2", "custom"] as const;
export const CRM_API_AUTH_METHODS = ["bearer", "api_key", "basic", "hmac", "custom"] as const;

export const leadAttributionInputSchema = z.object({
  capturedFrom: z.string().optional(),
  campaign: z.string().optional(),
  adGroup: z.string().optional(),
  keyword: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  landingPage: z.string().optional(),
  referrerUrl: z.string().optional(),
  ipAddress: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  channel: z.string().optional(),
  creative: z.string().optional(),
  cost: z.number().optional(),
});

export const leadSourceSchema = z.object({
  name: z.string().min(2),
  sourceTypeCode: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(LEAD_SOURCE_STATUSES).optional(),
  authType: z.enum(CRM_AUTH_TYPES).optional(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  rateLimitPerMinute: z.number().int().min(1).max(10000).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const crmApiKeySchema = z.object({
  name: z.string().min(2),
  leadSourceId: z.string().uuid().optional(),
  authMethod: z.enum(CRM_API_AUTH_METHODS).optional(),
  allowedDomains: z.array(z.string()).optional(),
  allowedIps: z.array(z.string()).optional(),
  rateLimitPerMinute: z.number().int().min(1).max(10000).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const crmFormSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
  category: z.string().optional(),
  successMessage: z.string().optional(),
  redirectUrl: z.string().url().optional().or(z.literal("")),
  spamProtection: z.enum(["none", "honeypot", "captcha"]).optional(),
  notificationEmail: z.string().email().optional().or(z.literal("")),
  leadSourceId: z.string().uuid().optional(),
  campaign: z.string().optional(),
  leadSourceLabel: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const crmFormFieldSchema = z.object({
  fieldKey: z.string().min(1),
  label: z.string().min(1),
  fieldType: z.string().min(1),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  validation: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().int().optional(),
  mapToLeadField: z.string().optional(),
});

export const crmWebhookSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  headers: z.record(z.string(), z.string()).optional(),
  authType: z.string().optional(),
  authConfig: z.record(z.string(), z.unknown()).optional(),
  payloadFormat: z.enum(["json", "xml", "form"]).optional(),
  retryPolicy: z.enum(["immediate", "5m", "15m", "1h", "24h"]).optional(),
  timeoutMs: z.number().int().min(1000).max(120000).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const publicLeadIngestSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  leadType: z.string().default("INBOUND"),
  source: z.string().optional(),
  notes: z.string().optional(),
  serviceId: z.string().uuid().optional(),
  attribution: leadAttributionInputSchema.optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
});

export const leadScoreRuleSchema = z.object({
  name: z.string().min(2),
  eventCode: z.string().min(2),
  points: z.number().int(),
  isActive: z.boolean().optional(),
});

export const pipelineRuleSchema = z.object({
  name: z.string().min(2),
  ruleType: z.enum(["round_robin", "least_loaded", "territory", "score", "source", "custom"]),
  priority: z.number().int().optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  actions: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const crmCampaignSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).optional(),
  channel: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  budget: z.number().optional(),
  utmCampaign: z.string().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

export const crmMessageTemplateSchema = z.object({
  name: z.string().min(2),
  channel: z.enum(["email", "sms", "whatsapp"]),
  subject: z.string().optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
  variables: z.array(z.string()).optional(),
});

export const crmSequenceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  triggerEvent: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
  steps: z
    .array(
      z.object({
        templateId: z.string().uuid(),
        delayMinutes: z.number().int().min(0).optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .optional(),
});
