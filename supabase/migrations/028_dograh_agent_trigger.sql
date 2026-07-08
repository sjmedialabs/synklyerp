-- Dograh public agent trigger UUID + optional telephony configuration

ALTER TABLE crm_dograh_tenant_config
  ADD COLUMN IF NOT EXISTS agent_trigger_uuid TEXT,
  ADD COLUMN IF NOT EXISTS telephony_configuration_id INTEGER;
