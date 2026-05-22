-- Dynamic Sidebar Engine (additive; backward compatible)

CREATE TABLE IF NOT EXISTS sidebar_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES sidebar_menus(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  path VARCHAR(255),
  icon VARCHAR(80),
  module_key VARCHAR(80),
  menu_type VARCHAR(40) NOT NULL DEFAULT 'item' CHECK (menu_type IN ('section', 'group', 'item')),
  permission_module VARCHAR(80),
  permission_feature VARCHAR(80),
  permission_action VARCHAR(20) NOT NULL DEFAULT 'read',
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  required_plan VARCHAR(40),
  required_business_types JSONB NOT NULL DEFAULT '[]',
  hidden_for_business_types JSONB NOT NULL DEFAULT '[]',
  required_submodules JSONB NOT NULL DEFAULT '[]',
  feature_flag_key VARCHAR(80),
  badge VARCHAR(40),
  status VARCHAR(20) NOT NULL DEFAULT 'built',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_sidebar_menus_parent ON sidebar_menus(parent_id, sort_order)
  WHERE deleted_at IS NULL AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sidebar_menus_module ON sidebar_menus(module_key)
  WHERE deleted_at IS NULL;

-- Extend sidebar_templates for business mapping
ALTER TABLE sidebar_templates ADD COLUMN IF NOT EXISTS business_type_id UUID REFERENCES business_types(id) ON DELETE SET NULL;
ALTER TABLE sidebar_templates ADD COLUMN IF NOT EXISTS business_subcategory_id UUID REFERENCES business_subcategories(id) ON DELETE SET NULL;
ALTER TABLE sidebar_templates ADD COLUMN IF NOT EXISTS business_specialization_id UUID REFERENCES business_specializations(id) ON DELETE SET NULL;
ALTER TABLE sidebar_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sidebar_templates ADD COLUMN IF NOT EXISTS required_plan VARCHAR(40);

CREATE TABLE IF NOT EXISTS sidebar_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES sidebar_templates(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES sidebar_menus(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_sidebar_template_items_template
  ON sidebar_template_items(template_id, sort_order);

CREATE TABLE IF NOT EXISTS tenant_sidebar_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES sidebar_templates(id) ON DELETE SET NULL,
  custom_order JSONB NOT NULL DEFAULT '{}',
  hidden_menu_slugs JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_menu_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  favorite_menu_slugs JSONB NOT NULL DEFAULT '[]',
  recent_paths JSONB NOT NULL DEFAULT '[]',
  pinned_sections JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_menu_preferences_user
  ON user_menu_preferences(tenant_id, user_id);

DO $$ BEGIN
  CREATE TRIGGER sidebar_menus_updated_at
    BEFORE UPDATE ON sidebar_menus FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER sidebar_template_items_updated_at
    BEFORE UPDATE ON sidebar_template_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER tenant_sidebar_configs_updated_at
    BEFORE UPDATE ON tenant_sidebar_configs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER user_menu_preferences_updated_at
    BEFORE UPDATE ON user_menu_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Default global template
INSERT INTO sidebar_templates (id, name, slug, description, is_default, is_active, sort_order)
VALUES (
  'c3000001-0001-4000-8000-000000000001',
  'SynklyERP Default',
  'default',
  'Default enterprise sidebar for all business types',
  TRUE,
  TRUE,
  0
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- Business-type templates
INSERT INTO sidebar_templates (id, name, slug, description, business_type_id, is_active, sort_order)
SELECT
  v.id::uuid,
  v.name,
  v.slug,
  v.description,
  bt.id,
  TRUE,
  v.sort_order
FROM (VALUES
  ('c3000001-0001-4000-8000-000000000002', 'Product ERP', 'product', 'Product-based business sidebar', 'product', 1),
  ('c3000001-0001-4000-8000-000000000003', 'Service ERP', 'service', 'Service-based business sidebar', 'service', 2),
  ('c3000001-0001-4000-8000-000000000004', 'Hybrid ERP', 'hybrid', 'Hybrid business sidebar', 'hybrid', 3)
) AS v(id, name, slug, description, type_slug, sort_order)
JOIN business_types bt ON bt.slug = v.type_slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  business_type_id = EXCLUDED.business_type_id,
  updated_at = NOW();
