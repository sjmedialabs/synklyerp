-- Enterprise Finance module: core tables for dashboard KPIs and activity tracking

CREATE TABLE IF NOT EXISTS finance_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_number TEXT,
  bank_name TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  opening_balance NUMERIC(16,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(16,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance_customer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES finance_customers(id) ON DELETE SET NULL,
  invoice_no TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance_vendor_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES finance_vendors(id) ON DELETE SET NULL,
  bill_no TEXT NOT NULL,
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance_customer_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES finance_customers(id) ON DELETE SET NULL,
  receipt_no TEXT NOT NULL,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance_vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES finance_vendors(id) ON DELETE SET NULL,
  payment_no TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entry_no TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  voucher_type TEXT NOT NULL DEFAULT 'JOURNAL',
  description TEXT,
  total_debit NUMERIC(16,2) NOT NULL DEFAULT 0,
  total_credit NUMERIC(16,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  posted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  reference_no TEXT,
  title TEXT NOT NULL,
  description TEXT,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_bank_accounts_tenant ON finance_bank_accounts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_customers_tenant ON finance_customers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_vendors_tenant ON finance_vendors(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_customer_invoices_tenant ON finance_customer_invoices(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_vendor_bills_tenant ON finance_vendor_bills(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_customer_receipts_tenant ON finance_customer_receipts(tenant_id, receipt_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_vendor_payments_tenant ON finance_vendor_payments(tenant_id, payment_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_journal_entries_tenant ON finance_journal_entries(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_activity_logs_tenant ON finance_activity_logs(tenant_id, occurred_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_bank_accounts_updated_at') THEN
    CREATE TRIGGER finance_bank_accounts_updated_at BEFORE UPDATE ON finance_bank_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_customers_updated_at') THEN
    CREATE TRIGGER finance_customers_updated_at BEFORE UPDATE ON finance_customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_vendors_updated_at') THEN
    CREATE TRIGGER finance_vendors_updated_at BEFORE UPDATE ON finance_vendors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_customer_invoices_updated_at') THEN
    CREATE TRIGGER finance_customer_invoices_updated_at BEFORE UPDATE ON finance_customer_invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_vendor_bills_updated_at') THEN
    CREATE TRIGGER finance_vendor_bills_updated_at BEFORE UPDATE ON finance_vendor_bills FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_customer_receipts_updated_at') THEN
    CREATE TRIGGER finance_customer_receipts_updated_at BEFORE UPDATE ON finance_customer_receipts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_vendor_payments_updated_at') THEN
    CREATE TRIGGER finance_vendor_payments_updated_at BEFORE UPDATE ON finance_vendor_payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'finance_journal_entries_updated_at') THEN
    CREATE TRIGGER finance_journal_entries_updated_at BEFORE UPDATE ON finance_journal_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Soft-remove legacy finance sidebar items (replaced by enterprise structure)
UPDATE sidebar_menus
SET is_active = false, is_visible = false, deleted_at = NOW()
WHERE slug IN (
  'accounting', 'invoicing', 'budgeting', 'expenses', 'tax-mgmt', 'banking',
  'vendor-payments', 'purchase-orders', 'financial-reports', 'multi-currency',
  'cost-centers', 'services-hub', 'service-catalog', 'pricing-rules', 'packages',
  'sla', 'service-contracts', 'amc-management', 'subscription-billing', 'service-requests'
)
AND deleted_at IS NULL;
