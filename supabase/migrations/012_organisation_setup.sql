-- Organisation Setup extensions (additive; backward compatible with branches table)

ALTER TABLE branches ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS area VARCHAR(255);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'regular';
ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_corporate BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_branches_tenant_status ON branches(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_branches_tenant_designation ON branches(tenant_id, designation) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_branches_tenant_primary ON branches(tenant_id, is_primary) WHERE deleted_at IS NULL AND is_primary = TRUE;

CREATE TABLE IF NOT EXISTS branch_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  module_code VARCHAR(100) NOT NULL,
  submodule_code VARCHAR(100),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, branch_id, module_code, submodule_code)
);

CREATE INDEX IF NOT EXISTS idx_branch_modules_branch ON branch_modules(branch_id) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_branch_modules_tenant ON branch_modules(tenant_id);

CREATE TABLE IF NOT EXISTS company_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  business_type VARCHAR(100),
  business_subcategory VARCHAR(100),
  tax_number VARCHAR(100),
  gst_number VARCHAR(100),
  pan_number VARCHAR(100),
  company_email VARCHAR(255),
  company_phone VARCHAR(50),
  website VARCHAR(255),
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),
  pincode VARCHAR(20),
  address TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_information_tenant ON company_information(tenant_id);

CREATE TABLE IF NOT EXISTS branch_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branch_audit_logs_tenant ON branch_audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_branch_audit_logs_branch ON branch_audit_logs(branch_id, created_at DESC);

DO $$ BEGIN
  CREATE TRIGGER branch_modules_updated_at BEFORE UPDATE ON branch_modules FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER company_information_updated_at BEFORE UPDATE ON company_information FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
