-- Finance Masters: Account Groups (extended), Financial Dimensions, Cost Centers

ALTER TABLE finance_account_groups ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES finance_account_groups(id) ON DELETE SET NULL;
ALTER TABLE finance_account_groups ADD COLUMN IF NOT EXISTS group_type TEXT NOT NULL DEFAULT 'Group';
ALTER TABLE finance_account_groups ADD COLUMN IF NOT EXISTS allow_manual_mapping BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE finance_account_groups ADD COLUMN IF NOT EXISTS budget_applicable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE finance_account_groups ADD COLUMN IF NOT EXISTS show_in_reports BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE finance_account_groups ADD COLUMN IF NOT EXISTS cost_center_applicable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE finance_account_groups ADD COLUMN IF NOT EXISTS profit_center_applicable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE finance_account_groups ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 0;
ALTER TABLE finance_account_groups ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE finance_account_groups ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS finance_financial_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dimension_code TEXT NOT NULL,
  dimension_name TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL DEFAULT 'List',
  allow_multiple_values BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, dimension_code)
);

CREATE TABLE IF NOT EXISTS finance_financial_dimension_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dimension_id UUID NOT NULL REFERENCES finance_financial_dimensions(id) ON DELETE CASCADE,
  value_code TEXT NOT NULL,
  value_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, dimension_id, value_code)
);

CREATE TABLE IF NOT EXISTS finance_cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES finance_cost_centers(id) ON DELETE SET NULL,
  cost_center_code TEXT NOT NULL,
  cost_center_name TEXT NOT NULL,
  cost_center_type TEXT NOT NULL DEFAULT 'Administrative',
  manager_name TEXT,
  location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  budget_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  allow_manual_entry BOOLEAN NOT NULL DEFAULT true,
  include_in_budget BOOLEAN NOT NULL DEFAULT true,
  allow_transactions BOOLEAN NOT NULL DEFAULT true,
  is_billable BOOLEAN NOT NULL DEFAULT false,
  level INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, cost_center_code)
);

CREATE INDEX IF NOT EXISTS idx_finance_account_groups_parent ON finance_account_groups(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_dimensions_tenant ON finance_financial_dimensions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_dimension_values_dim ON finance_financial_dimension_values(dimension_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_cost_centers_tenant ON finance_cost_centers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_cost_centers_parent ON finance_cost_centers(parent_id) WHERE deleted_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_financial_dimensions_updated_at') THEN
    CREATE TRIGGER finance_financial_dimensions_updated_at BEFORE UPDATE ON finance_financial_dimensions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_financial_dimension_values_updated_at') THEN
    CREATE TRIGGER finance_financial_dimension_values_updated_at BEFORE UPDATE ON finance_financial_dimension_values FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_cost_centers_updated_at') THEN
    CREATE TRIGGER finance_cost_centers_updated_at BEFORE UPDATE ON finance_cost_centers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

UPDATE sidebar_menus SET status = 'built'
WHERE slug IN ('fin-masters-account-groups', 'fin-masters-financial-dimensions', 'fin-masters-cost-centers')
AND deleted_at IS NULL;
