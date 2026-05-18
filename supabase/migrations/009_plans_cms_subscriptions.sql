-- Platform plans, subscriptions, CMS, and media (run after 008)

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  plan_type TEXT NOT NULL DEFAULT 'starter',
  monthly_price_cents INTEGER NOT NULL DEFAULT 0,
  yearly_price_cents INTEGER NOT NULL DEFAULT 0,
  trial_days INTEGER NOT NULL DEFAULT 14,
  currency TEXT NOT NULL DEFAULT 'INR',
  features_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  modules TEXT[] NOT NULL DEFAULT '{}',
  user_limit INTEGER,
  storage_limit_mb INTEGER,
  api_limit_monthly INTEGER,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'trialing',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  payment_provider TEXT,
  external_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_tenant_active
  ON subscriptions(tenant_id)
  WHERE status IN ('trialing', 'active', 'past_due');

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_plan_id UUID REFERENCES plans(id),
  to_plan_id UUID REFERENCES plans(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  default_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_feature_flags (
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (plan_id, feature_flag_id)
);

CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  content_html TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  schema_json JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES cms_pages(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  folder TEXT DEFAULT 'general',
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content_html TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  author_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (slug)
);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);

CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug) WHERE deleted_at IS NULL;

INSERT INTO plans (name, slug, description, plan_type, monthly_price_cents, yearly_price_cents, trial_days, features_json, modules, user_limit, sort_order)
VALUES
  ('Free', 'free', 'Get started with core CRM features', 'free', 0, 0, 0,
   '["Dashboard","CRM","Leads"]'::jsonb, ARRAY['Sales']::TEXT[], 3, 0),
  ('Starter', 'starter', 'Growing teams — CRM, leads, and sales', 'starter', 199900, 1999000, 14,
   '["Dashboard","CRM","Leads","Basic reports"]'::jsonb, ARRAY['Sales','Marketing']::TEXT[], 10, 1),
  ('Professional', 'professional', 'HR, Finance, and full operations', 'professional', 499900, 4999000, 14,
   '["HRMS","Finance","Inventory","Advanced reports"]'::jsonb, ARRAY['HR','Finance','Sales','Projects','Operations']::TEXT[], 50, 2),
  ('Enterprise', 'enterprise', 'Full platform access and priority support', 'enterprise', 0, 0, 30,
   '["All modules","API access","SSO","Dedicated support"]'::jsonb, ARRAY['HR','Finance','Sales','Projects','Operations','Marketing']::TEXT[], NULL, 3)
ON CONFLICT (slug) DO NOTHING;
