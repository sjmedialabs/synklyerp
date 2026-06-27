-- Subscription enforcement helpers + module scope content for tenant pages

CREATE TABLE IF NOT EXISTS tenant_module_scope_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  item_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'available')),
  sort_order INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, page_path, item_key)
);

CREATE INDEX IF NOT EXISTS idx_module_scope_tenant_path
  ON tenant_module_scope_items (tenant_id, page_path);

COMMENT ON TABLE tenant_module_scope_items IS 'Per-tenant scope checklist items backing module placeholder pages';
