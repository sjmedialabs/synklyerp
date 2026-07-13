-- Finance Masters: Account Groups & Chart of Accounts

CREATE TABLE IF NOT EXISTS finance_account_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS finance_chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES finance_chart_of_accounts(id) ON DELETE SET NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  description TEXT,
  account_group_id UUID REFERENCES finance_account_groups(id) ON DELETE SET NULL,
  account_type TEXT NOT NULL DEFAULT 'Posting',
  account_category TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  allow_manual_entry BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  cost_center_applicable BOOLEAN NOT NULL DEFAULT false,
  budget_control BOOLEAN NOT NULL DEFAULT false,
  balance_sheet_classification TEXT,
  profit_loss_classification TEXT,
  tax_category TEXT,
  vat_gst_applicable TEXT DEFAULT 'No',
  level INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, account_code)
);

CREATE INDEX IF NOT EXISTS idx_finance_account_groups_tenant ON finance_account_groups(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_coa_tenant ON finance_chart_of_accounts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_coa_parent ON finance_chart_of_accounts(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_coa_group ON finance_chart_of_accounts(account_group_id) WHERE deleted_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_account_groups_updated_at') THEN
    CREATE TRIGGER finance_account_groups_updated_at BEFORE UPDATE ON finance_account_groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_chart_of_accounts_updated_at') THEN
    CREATE TRIGGER finance_chart_of_accounts_updated_at BEFORE UPDATE ON finance_chart_of_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

UPDATE sidebar_menus
SET status = 'built'
WHERE slug = 'fin-masters-chart-of-accounts' AND deleted_at IS NULL;
