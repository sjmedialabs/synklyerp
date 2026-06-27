-- ERP Feature Master extensions + plan/org assignment (future-ready)

ALTER TABLE sidebar_menus ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sidebar_menus ADD COLUMN IF NOT EXISTS is_always_visible BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sidebar_menus ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sidebar_menus_level ON sidebar_menus(level, sort_order)
  WHERE deleted_at IS NULL;

-- Mark core navigation items as always visible (replaces hardcoded ALWAYS_VISIBLE_SLUGS)
UPDATE sidebar_menus SET is_always_visible = TRUE
WHERE slug IN ('dashboard', 'setup', 'account', 'business-type', 'organisation-hub', 'company-info', 'branch-mgmt', 'settings')
  AND deleted_at IS NULL;

-- Plan → menu assignments (subscription gating)
CREATE TABLE IF NOT EXISTS plan_menu_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES sidebar_menus(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_menu_assignments_plan
  ON plan_menu_assignments(plan_id) WHERE is_enabled = TRUE;

-- Organization-level menu overrides (future: disable Finance for one org while type has it)
CREATE TABLE IF NOT EXISTS organization_menu_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES sidebar_menus(id) ON DELETE CASCADE,
  override_type VARCHAR(20) NOT NULL CHECK (override_type IN ('enable', 'disable')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_menu_overrides_tenant
  ON organization_menu_overrides(tenant_id);

CREATE TABLE IF NOT EXISTS erp_feature_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID REFERENCES sidebar_menus(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER plan_menu_assignments_updated_at
    BEFORE UPDATE ON plan_menu_assignments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER organization_menu_overrides_updated_at
    BEFORE UPDATE ON organization_menu_overrides FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
