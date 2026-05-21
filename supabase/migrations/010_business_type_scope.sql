-- Business type scope: submodule activation metadata on tenants

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS enabled_submodules JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_tenants_enabled_submodules ON tenants USING GIN (enabled_submodules)
  WHERE deleted_at IS NULL;
