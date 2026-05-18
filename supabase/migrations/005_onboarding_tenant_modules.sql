-- Tenant onboarding state and module activation (non-breaking)

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS employee_count TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_size TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_draft JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_locked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tenants_onboarding ON tenants(onboarding_completed_at)
  WHERE deleted_at IS NULL;

-- Per-tenant enabled ERP modules
CREATE TABLE IF NOT EXISTS tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules(tenant_id)
  WHERE is_active = TRUE;

-- Optional multi-tenant membership (future tenant switching)
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id, status);

-- Backfill tenant_users from existing users.tenant_id
INSERT INTO tenant_users (tenant_id, user_id, role_id, is_primary, status)
SELECT u.tenant_id, u.id, u.role_id, TRUE, u.status
FROM users u
WHERE u.tenant_id IS NOT NULL
  AND u.deleted_at IS NULL
ON CONFLICT (tenant_id, user_id) DO NOTHING;
