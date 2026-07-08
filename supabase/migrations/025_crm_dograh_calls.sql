-- Dograh AI voice call logs and lead AI fields

ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS crm_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  external_call_id TEXT,
  status TEXT,
  summary TEXT,
  transcript TEXT,
  recording_url TEXT,
  duration_seconds INT,
  visit_date DATE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_call_logs_lead ON crm_call_logs(tenant_id, lead_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_call_logs_external ON crm_call_logs(tenant_id, external_call_id)
  WHERE external_call_id IS NOT NULL;
