-- Enterprise CRM Lead Capture & Automation (additive, non-destructive)

-- Extend existing leads table (nullable columns only)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS crm_lead_source_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS original_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INT NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID;

COMMENT ON COLUMN leads.original_source IS 'Immutable capture source label; never updated after creation';
COMMENT ON COLUMN leads.crm_lead_source_id IS 'FK to crm_lead_sources when captured via hub';

CREATE TABLE IF NOT EXISTS crm_source_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO crm_source_types (code, name, sort_order) VALUES
  ('website_form', 'Website Form', 1),
  ('landing_page', 'Landing Page', 2),
  ('facebook_lead_ad', 'Facebook Lead Ads', 3),
  ('google_lead_form', 'Google Lead Forms', 4),
  ('linkedin_lead_form', 'LinkedIn Lead Forms', 5),
  ('whatsapp', 'WhatsApp Business API', 6),
  ('webhook', 'Webhook', 7),
  ('rest_api', 'REST API', 8),
  ('csv_import', 'CSV Import', 9),
  ('email_parser', 'Email Parser', 10),
  ('manual', 'Manual Entry', 11),
  ('referral', 'Referral', 12),
  ('partner', 'Partner Portal', 13),
  ('zapier', 'Zapier', 14),
  ('custom', 'Custom Integration', 99)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS crm_lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_type_code TEXT NOT NULL REFERENCES crm_source_types(code),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PAUSED')),
  auth_type TEXT NOT NULL DEFAULT 'api_key' CHECK (auth_type IN ('none', 'api_key', 'bearer', 'basic', 'hmac', 'oauth2', 'custom')),
  webhook_url TEXT,
  webhook_secret_hash TEXT,
  api_key_prefix TEXT,
  rate_limit_per_minute INT NOT NULL DEFAULT 60,
  health_status TEXT NOT NULL DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  total_leads INT NOT NULL DEFAULT 0,
  successful_requests INT NOT NULL DEFAULT 0,
  failed_requests INT NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  config JSONB NOT NULL DEFAULT '{}',
  headers JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_lead_sources_tenant ON crm_lead_sources(tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS crm_source_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_source_id UUID NOT NULL REFERENCES crm_lead_sources(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_source_id UUID REFERENCES crm_lead_sources(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  auth_method TEXT NOT NULL DEFAULT 'bearer' CHECK (auth_method IN ('bearer', 'api_key', 'basic', 'hmac', 'custom')),
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',
  allowed_ips TEXT[] NOT NULL DEFAULT '{}',
  rate_limit_per_minute INT NOT NULL DEFAULT 120,
  api_version TEXT NOT NULL DEFAULT 'v1',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED')),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_api_keys_tenant ON crm_api_keys(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_api_keys_prefix ON crm_api_keys(key_prefix) WHERE deleted_at IS NULL AND status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS crm_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES crm_api_keys(id) ON DELETE SET NULL,
  lead_source_id UUID REFERENCES crm_lead_sources(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INT NOT NULL,
  processing_ms INT,
  request_headers JSONB NOT NULL DEFAULT '{}',
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_api_logs_tenant_created ON crm_api_logs(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS crm_lead_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE UNIQUE,
  captured_from TEXT,
  campaign TEXT,
  ad_group TEXT,
  keyword TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  landing_page TEXT,
  referrer_url TEXT,
  ip_address TEXT,
  device TEXT,
  browser TEXT,
  country TEXT,
  city TEXT,
  timezone TEXT,
  language TEXT,
  channel TEXT,
  creative TEXT,
  cost NUMERIC(14, 2),
  capture_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_lead_attribution_lead ON crm_lead_attribution(lead_id);

CREATE TABLE IF NOT EXISTS crm_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_lead_activities_lead ON crm_lead_activities(lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS crm_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_source_id UUID REFERENCES crm_lead_sources(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE')),
  category TEXT,
  success_message TEXT,
  redirect_url TEXT,
  spam_protection TEXT NOT NULL DEFAULT 'none' CHECK (spam_protection IN ('none', 'honeypot', 'captcha')),
  notification_email TEXT,
  pipeline_id UUID,
  lead_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  campaign TEXT,
  lead_source_label TEXT,
  embed_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  view_count INT NOT NULL DEFAULT 0,
  submission_count INT NOT NULL DEFAULT 0,
  spam_count INT NOT NULL DEFAULT 0,
  last_submission_at TIMESTAMPTZ,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_forms_tenant ON crm_forms(tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS crm_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES crm_forms(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  options JSONB NOT NULL DEFAULT '[]',
  validation JSONB NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  map_to_lead_field TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (form_id, field_key)
);

CREATE TABLE IF NOT EXISTS crm_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES crm_forms(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  is_spam BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  headers JSONB NOT NULL DEFAULT '{}',
  auth_type TEXT NOT NULL DEFAULT 'none',
  auth_config JSONB NOT NULL DEFAULT '{}',
  payload_format TEXT NOT NULL DEFAULT 'json' CHECK (payload_format IN ('json', 'xml', 'form')),
  retry_policy TEXT NOT NULL DEFAULT 'immediate' CHECK (retry_policy IN ('immediate', '5m', '15m', '1h', '24h')),
  timeout_ms INT NOT NULL DEFAULT 30000,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  secret_hash TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS crm_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  webhook_id UUID NOT NULL REFERENCES crm_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INT,
  response_body TEXT,
  error_message TEXT,
  attempt INT NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_webhook_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  webhook_id UUID NOT NULL REFERENCES crm_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  scheduled_at TIMESTAMPTZ NOT NULL,
  attempt INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'dead')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_code TEXT NOT NULL,
  points INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, event_code)
);

CREATE TABLE IF NOT EXISTS crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  probability INT NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6366f1',
  expected_days INT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_pipeline_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('round_robin', 'least_loaded', 'territory', 'score', 'source', 'custom')),
  priority INT NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_duplicate_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  incoming_payload JSONB NOT NULL DEFAULT '{}',
  matched_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  match_fields TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'merged', 'ignored', 'created')),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  delays JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES crm_automation_rules(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_lead_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign TEXT,
  ad_group TEXT,
  keyword TEXT,
  channel TEXT,
  cost NUMERIC(14, 2),
  roi NUMERIC(14, 2),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK from leads to lead sources (after table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_crm_lead_source_id_fkey'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_crm_lead_source_id_fkey
      FOREIGN KEY (crm_lead_source_id) REFERENCES crm_lead_sources(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_crm_source ON leads(tenant_id, crm_lead_source_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_original_source ON leads(tenant_id, original_source) WHERE deleted_at IS NULL;
