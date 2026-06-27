-- Business Category → Sidebar Menu feature assignments (relational)
--
-- PREREQUISITES (run in Supabase SQL Editor before this file):
--   011_business_provisioning_engine.sql  → business_types, business_subcategories
--   015_dynamic_sidebar_engine.sql        → sidebar_menus
--   001_core_organisation.sql             → users, set_updated_at() (if not already applied)
--
-- Apply all migrations in numeric order (001 → 016) on a fresh database.

CREATE TABLE IF NOT EXISTS business_category_menu_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES sidebar_menus(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_type_id, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_business_category_menu_assignments_type
  ON business_category_menu_assignments(business_type_id)
  WHERE is_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_business_category_menu_assignments_menu
  ON business_category_menu_assignments(menu_id);

CREATE TABLE IF NOT EXISTS business_category_assignment_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  menu_id UUID REFERENCES sidebar_menus(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_category_assignment_audit_type
  ON business_category_assignment_audit_logs(business_type_id, created_at DESC);

DO $$ BEGIN
  CREATE TRIGGER business_category_menu_assignments_updated_at
    BEFORE UPDATE ON business_category_menu_assignments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
