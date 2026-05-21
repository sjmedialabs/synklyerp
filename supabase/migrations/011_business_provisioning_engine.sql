-- Business Type Provisioning Engine (additive; backward compatible with 005/010)

DO $$ BEGIN
  CREATE TYPE provisioning_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'rolled_back');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  legacy_key VARCHAR(40),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  description TEXT,
  legacy_key VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_type_id, slug)
);

CREATE TABLE IF NOT EXISTS tenant_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  business_type_id UUID NOT NULL REFERENCES business_types(id),
  business_subcategory_id UUID NOT NULL REFERENCES business_subcategories(id),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  provisioning_status provisioning_status NOT NULL DEFAULT 'pending',
  provisioning_metadata JSONB NOT NULL DEFAULT '{}',
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_business_profiles_tenant ON tenant_business_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_business_profiles_status ON tenant_business_profiles(provisioning_status);

CREATE TABLE IF NOT EXISTS tenant_enabled_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_code VARCHAR(80) NOT NULL,
  submodule_code VARCHAR(80),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  enabled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, module_code, submodule_code)
);

CREATE INDEX IF NOT EXISTS idx_tenant_enabled_modules_tenant ON tenant_enabled_modules(tenant_id)
  WHERE enabled = TRUE;

CREATE TABLE IF NOT EXISTS tenant_dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  widget_code VARCHAR(80) NOT NULL,
  position JSONB NOT NULL DEFAULT '{"order":0,"column":1,"span":1}',
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, widget_code)
);

CREATE INDEX IF NOT EXISTS idx_tenant_dashboard_configs_tenant ON tenant_dashboard_configs(tenant_id)
  WHERE visible = TRUE;

CREATE TABLE IF NOT EXISTS tenant_workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_code VARCHAR(80) NOT NULL,
  workflow_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, workflow_code)
);

CREATE INDEX IF NOT EXISTS idx_tenant_workflow_templates_tenant ON tenant_workflow_templates(tenant_id);

-- Seed business types (stable IDs for config references)
INSERT INTO business_types (id, name, slug, description, legacy_key, is_active)
VALUES
  ('a1000001-0001-4000-8000-000000000001', 'Product-Based Business', 'product', 'Businesses primarily selling physical or digital products', 'Product', TRUE),
  ('a1000001-0001-4000-8000-000000000002', 'Service-Based Business', 'service', 'Businesses providing services, consulting, or expertise', 'Service', TRUE),
  ('a1000001-0001-4000-8000-000000000003', 'Hybrid Business', 'hybrid', 'Businesses operating both products and services', 'Hybrid', TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  legacy_key = EXCLUDED.legacy_key,
  updated_at = NOW();

-- Product subcategories
INSERT INTO business_subcategories (business_type_id, name, slug, legacy_key)
SELECT bt.id, v.name, v.slug, v.legacy_key
FROM business_types bt
CROSS JOIN (VALUES
  ('Manufacturing', 'manufacturing', 'Manufacturing'),
  ('Retail', 'retail', 'Retail'),
  ('E-Commerce', 'e-commerce', 'E-Commerce'),
  ('FMCG', 'fmcg', 'FMCG'),
  ('Food & Beverage', 'food-beverage', 'Food & Beverage'),
  ('Distribution', 'distribution', 'Distribution'),
  ('Wholesale', 'wholesale', 'Wholesale')
) AS v(name, slug, legacy_key)
WHERE bt.slug = 'product'
ON CONFLICT (business_type_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  legacy_key = EXCLUDED.legacy_key,
  updated_at = NOW();

-- Service subcategories
INSERT INTO business_subcategories (business_type_id, name, slug, legacy_key)
SELECT bt.id, v.name, v.slug, v.legacy_key
FROM business_types bt
CROSS JOIN (VALUES
  ('IT Services', 'it-services', 'IT Services'),
  ('Healthcare', 'healthcare', 'Healthcare'),
  ('Education', 'education', 'Education'),
  ('Consulting', 'consulting', 'Consulting'),
  ('Finance', 'finance', 'Finance'),
  ('Legal Services', 'legal-services', 'Legal Services'),
  ('Marketing Agency', 'marketing-agency', 'Marketing Agency')
) AS v(name, slug, legacy_key)
WHERE bt.slug = 'service'
ON CONFLICT (business_type_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  legacy_key = EXCLUDED.legacy_key,
  updated_at = NOW();

-- Hybrid subcategories
INSERT INTO business_subcategories (business_type_id, name, slug, legacy_key)
SELECT bt.id, v.name, v.slug, v.legacy_key
FROM business_types bt
CROSS JOIN (VALUES
  ('Restaurant', 'restaurant', 'Restaurant'),
  ('Fitness', 'fitness', 'Fitness'),
  ('Wellness', 'wellness', 'Wellness'),
  ('Franchise', 'franchise', 'Franchise'),
  ('Automobile', 'automobile', 'Automobile'),
  ('Electronics', 'electronics', 'Electronics'),
  ('Healthcare Chains', 'healthcare-chains', 'Healthcare Chains')
) AS v(name, slug, legacy_key)
WHERE bt.slug = 'hybrid'
ON CONFLICT (business_type_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  legacy_key = EXCLUDED.legacy_key,
  updated_at = NOW();
