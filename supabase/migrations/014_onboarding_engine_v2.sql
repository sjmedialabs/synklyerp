-- Onboarding Engine v2: three-tier catalog, sessions, templates (additive)

-- Extend business_types with presentation + ordering
ALTER TABLE business_types ADD COLUMN IF NOT EXISTS icon VARCHAR(80);
ALTER TABLE business_types ADD COLUMN IF NOT EXISTS color VARCHAR(20);
ALTER TABLE business_types ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20);
ALTER TABLE business_types ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE business_types ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Extend business_subcategories (category tier in onboarding UX)
ALTER TABLE business_subcategories ADD COLUMN IF NOT EXISTS icon VARCHAR(80);
ALTER TABLE business_subcategories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE business_subcategories ADD COLUMN IF NOT EXISTS enabled_modules JSONB NOT NULL DEFAULT '[]';
ALTER TABLE business_subcategories ADD COLUMN IF NOT EXISTS dashboard_template_id UUID;
ALTER TABLE business_subcategories ADD COLUMN IF NOT EXISTS sidebar_preset JSONB NOT NULL DEFAULT '{}';
ALTER TABLE business_subcategories ADD COLUMN IF NOT EXISTS workflows JSONB NOT NULL DEFAULT '[]';
ALTER TABLE business_subcategories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE business_subcategories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_business_subcategories_type_active
  ON business_subcategories(business_type_id, sort_order)
  WHERE is_active = TRUE AND deleted_at IS NULL;

-- Dashboard templates (Super Admin configurable)
CREATE TABLE IF NOT EXISTS dashboard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  layout JSONB NOT NULL DEFAULT '{"columns":4,"rows":[]}',
  widgets JSONB NOT NULL DEFAULT '[]',
  kpis JSONB NOT NULL DEFAULT '[]',
  charts JSONB NOT NULL DEFAULT '[]',
  quick_actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dashboard_templates_active
  ON dashboard_templates(sort_order) WHERE is_active = TRUE AND deleted_at IS NULL;

-- Sidebar templates
CREATE TABLE IF NOT EXISTS sidebar_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  menu_tree JSONB NOT NULL DEFAULT '[]',
  icon_map JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Module mappings per category
CREATE TABLE IF NOT EXISTS module_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_subcategory_id UUID NOT NULL REFERENCES business_subcategories(id) ON DELETE CASCADE,
  module_code VARCHAR(80) NOT NULL,
  submodule_code VARCHAR(80),
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_subcategory_id, module_code, submodule_code)
);

CREATE INDEX IF NOT EXISTS idx_module_mappings_subcategory
  ON module_mappings(business_subcategory_id, sort_order);

-- Third tier: business specializations (subcategories in UX)
CREATE TABLE IF NOT EXISTS business_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_subcategory_id UUID NOT NULL REFERENCES business_subcategories(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  description TEXT,
  icon VARCHAR(80),
  onboarding_form_schema JSONB NOT NULL DEFAULT '{}',
  workflow_rules JSONB NOT NULL DEFAULT '[]',
  default_modules JSONB NOT NULL DEFAULT '[]',
  enabled_reports JSONB NOT NULL DEFAULT '[]',
  dashboard_template_id UUID REFERENCES dashboard_templates(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (business_subcategory_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_business_specializations_subcategory
  ON business_specializations(business_subcategory_id, sort_order)
  WHERE is_active = TRUE AND deleted_at IS NULL;

-- Dynamic onboarding form templates
CREATE TABLE IF NOT EXISTS onboarding_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  business_specialization_id UUID REFERENCES business_specializations(id) ON DELETE SET NULL,
  business_subcategory_id UUID REFERENCES business_subcategories(id) ON DELETE SET NULL,
  form_schema JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Progressive onboarding sessions (autosave)
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  current_step INT NOT NULL DEFAULT 0,
  business_type_id UUID REFERENCES business_types(id) ON DELETE SET NULL,
  business_category_id UUID REFERENCES business_subcategories(id) ON DELETE SET NULL,
  business_specialization_id UUID REFERENCES business_specializations(id) ON DELETE SET NULL,
  organization_data JSONB NOT NULL DEFAULT '{}',
  employee_count VARCHAR(20),
  business_size VARCHAR(30),
  metadata JSONB NOT NULL DEFAULT '{}',
  last_saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_tenant ON onboarding_sessions(tenant_id);

-- Extend tenant business profiles with specialization
ALTER TABLE tenant_business_profiles
  ADD COLUMN IF NOT EXISTS business_specialization_id UUID REFERENCES business_specializations(id) ON DELETE SET NULL;

-- Track onboarding step on tenant
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_step INT NOT NULL DEFAULT 0;

-- FK for dashboard template on subcategories (after table exists)
DO $$ BEGIN
  ALTER TABLE business_subcategories
    ADD CONSTRAINT fk_business_subcategories_dashboard_template
    FOREIGN KEY (dashboard_template_id) REFERENCES dashboard_templates(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed business type presentation
UPDATE business_types SET
  icon = CASE slug
    WHEN 'product' THEN 'package'
    WHEN 'service' THEN 'briefcase'
    WHEN 'hybrid' THEN 'zap'
    ELSE 'building'
  END,
  color = CASE slug
    WHEN 'product' THEN '#f59e0b'
    WHEN 'service' THEN '#6366f1'
    WHEN 'hybrid' THEN '#eab308'
    ELSE '#64748b'
  END,
  theme_color = CASE slug
    WHEN 'product' THEN 'amber'
    WHEN 'service' THEN 'indigo'
    WHEN 'hybrid' THEN 'yellow'
    ELSE 'slate'
  END,
  sort_order = CASE slug
    WHEN 'product' THEN 1
    WHEN 'service' THEN 2
    WHEN 'hybrid' THEN 3
    ELSE 99
  END
WHERE icon IS NULL OR sort_order = 0;

-- Seed category icons
UPDATE business_subcategories SET icon = CASE slug
  WHEN 'manufacturing' THEN 'factory'
  WHEN 'retail' THEN 'store'
  WHEN 'e-commerce' THEN 'shopping-cart'
  WHEN 'it-services' THEN 'code'
  WHEN 'healthcare' THEN 'heart-pulse'
  WHEN 'restaurant' THEN 'utensils'
  WHEN 'fitness' THEN 'dumbbell'
  ELSE 'circle'
END WHERE icon IS NULL;

-- Seed specializations for key categories
INSERT INTO business_specializations (business_subcategory_id, name, slug, description, icon, sort_order)
SELECT bs.id, v.name, v.slug, v.description, v.icon, v.sort_order
FROM business_subcategories bs
JOIN business_types bt ON bt.id = bs.business_type_id
CROSS JOIN (VALUES
  ('Software Development', 'software-development', 'Custom software and application development', 'code', 1),
  ('AI / ML', 'ai-ml', 'Artificial intelligence and machine learning services', 'brain', 2),
  ('SaaS Products', 'saas', 'Software-as-a-service product companies', 'cloud', 3),
  ('Cloud Services', 'cloud-services', 'Cloud infrastructure and managed services', 'server', 4),
  ('Cyber Security', 'cyber-security', 'Security consulting and managed security', 'shield', 5)
) AS v(name, slug, description, icon, sort_order)
WHERE bt.slug = 'service' AND bs.slug = 'it-services'
ON CONFLICT (business_subcategory_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO business_specializations (business_subcategory_id, name, slug, description, icon, sort_order)
SELECT bs.id, v.name, v.slug, v.description, v.icon, v.sort_order
FROM business_subcategories bs
JOIN business_types bt ON bt.id = bs.business_type_id
CROSS JOIN (VALUES
  ('Grocery Store', 'grocery', 'Supermarkets and grocery retail', 'shopping-basket', 1),
  ('Fashion Store', 'fashion-store', 'Apparel and fashion retail', 'shirt', 2),
  ('Electronics Store', 'electronics-store', 'Consumer electronics retail', 'smartphone', 3),
  ('Furniture Store', 'furniture-store', 'Home and office furniture retail', 'sofa', 4)
) AS v(name, slug, description, icon, sort_order)
WHERE bt.slug = 'product' AND bs.slug = 'retail'
ON CONFLICT (business_subcategory_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO business_specializations (business_subcategory_id, name, slug, description, icon, sort_order)
SELECT bs.id, v.name, v.slug, v.description, v.icon, v.sort_order
FROM business_subcategories bs
JOIN business_types bt ON bt.id = bs.business_type_id
CROSS JOIN (VALUES
  ('Cafe', 'cafe', 'Coffee shops and casual dining cafes', 'coffee', 1),
  ('Fine Dining', 'fine-dining', 'Premium full-service restaurants', 'wine', 2),
  ('Cloud Kitchen', 'cloud-kitchen', 'Delivery-only kitchen operations', 'truck', 3),
  ('Franchise Outlet', 'franchise-outlet', 'Franchise restaurant locations', 'building-2', 4)
) AS v(name, slug, description, icon, sort_order)
WHERE bt.slug = 'hybrid' AND bs.slug = 'restaurant'
ON CONFLICT (business_subcategory_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Default dashboard templates
INSERT INTO dashboard_templates (id, name, slug, description, widgets, kpis, quick_actions, sort_order)
VALUES
  (
    'b2000001-0001-4000-8000-000000000001',
    'Product Operations',
    'product-ops',
    'Default dashboard for product-based businesses',
    '["welcome","activity","quick_actions"]',
    '["inventory_value","sales_orders","low_stock","revenue"]',
    '["create_order","add_product","view_inventory"]',
    1
  ),
  (
    'b2000001-0001-4000-8000-000000000002',
    'Service Delivery',
    'service-delivery',
    'Default dashboard for service-based businesses',
    '["welcome","activity","quick_actions"]',
    '["active_projects","billable_hours","pipeline","revenue"]',
    '["new_project","log_time","create_invoice"]',
    2
  ),
  (
    'b2000001-0001-4000-8000-000000000003',
    'Hybrid Operations',
    'hybrid-ops',
    'Default dashboard for hybrid businesses',
    '["welcome","activity","quick_actions"]',
    '["revenue","orders","projects","utilization"]',
    '["pos_sale","new_project","view_reports"]',
    3
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  widgets = EXCLUDED.widgets,
  kpis = EXCLUDED.kpis,
  quick_actions = EXCLUDED.quick_actions,
  updated_at = NOW();

DO $$ BEGIN
  CREATE TRIGGER dashboard_templates_updated_at
    BEFORE UPDATE ON dashboard_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER sidebar_templates_updated_at
    BEFORE UPDATE ON sidebar_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER business_specializations_updated_at
    BEFORE UPDATE ON business_specializations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER onboarding_sessions_updated_at
    BEFORE UPDATE ON onboarding_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER module_mappings_updated_at
    BEFORE UPDATE ON module_mappings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER onboarding_form_templates_updated_at
    BEFORE UPDATE ON onboarding_form_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
