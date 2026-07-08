-- Dograh AI voice tenant config + property lead fields

ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS project_interest TEXT;

CREATE TABLE IF NOT EXISTS crm_dograh_tenant_config (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  server_url TEXT,
  api_key TEXT,
  public_app_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER crm_dograh_tenant_config_updated_at
    BEFORE UPDATE ON crm_dograh_tenant_config FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
