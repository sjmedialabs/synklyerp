-- Unified Company Profile (master tenant configuration)

CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,

  legal_company_name VARCHAR(255),
  trade_name VARCHAR(255),

  company_type TEXT CHECK (company_type IN ('private_limited', 'llp', 'partnership', 'sole_proprietor')),

  industry_type VARCHAR(255),
  subcategory VARCHAR(255),

  incorporation_date DATE,

  gst_number VARCHAR(20),
  pan_number VARCHAR(20),
  cin_number VARCHAR(30),
  tan_number VARCHAR(30),
  msme_number VARCHAR(50),

  address_line_1 TEXT,
  address_line_2 TEXT,

  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),

  pincode VARCHAR(20),

  official_email VARCHAR(255),
  contact_phone VARCHAR(30),
  alternate_phone VARCHAR(30),

  website_url VARCHAR(255),

  business_description TEXT,

  employee_range VARCHAR(50),

  annual_turnover DECIMAL(18, 2),

  logo_url TEXT,

  primary_color VARCHAR(20),
  secondary_color VARCHAR(20),

  tagline VARCHAR(255),

  bank_account_name VARCHAR(255),
  bank_name VARCHAR(255),
  account_number VARCHAR(100),
  ifsc_code VARCHAR(20),
  bank_branch_name VARCHAR(255),

  profile_completion_percentage INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_profiles_tenant ON company_profiles(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_profiles_tenant_gst
  ON company_profiles(tenant_id, gst_number)
  WHERE gst_number IS NOT NULL AND gst_number <> '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_profiles_tenant_pan
  ON company_profiles(tenant_id, pan_number)
  WHERE pan_number IS NOT NULL AND pan_number <> '';

CREATE TABLE IF NOT EXISTS company_profile_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_profile_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_profile_audit_tenant
  ON company_profile_audit_logs(tenant_id, created_at DESC);

DO $$ BEGIN
  CREATE TRIGGER company_profiles_updated_at
    BEFORE UPDATE ON company_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
