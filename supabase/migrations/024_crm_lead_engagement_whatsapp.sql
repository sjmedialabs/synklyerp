-- Lead engagement tracking, follow-up reminders, WhatsApp Business conversations

CREATE TABLE IF NOT EXISTS crm_lead_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('call', 'sms', 'email', 'whatsapp')),
  action TEXT NOT NULL DEFAULT 'click',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_lead_engagements_lead ON crm_lead_engagements(tenant_id, lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_lead_engagements_user ON crm_lead_engagements(tenant_id, user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS crm_followup_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_followup_reminders_due ON crm_followup_reminders(tenant_id, assigned_to, due_at)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS crm_whatsapp_tenant_config (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number_id TEXT,
  business_account_id TEXT,
  access_token TEXT,
  webhook_verify_token TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  ai_mode TEXT NOT NULL DEFAULT 'assist' CHECK (ai_mode IN ('assist', 'auto', 'human')),
  summary TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, lead_id)
);

CREATE TABLE IF NOT EXISTS crm_whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES crm_whatsapp_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'human' CHECK (sender_type IN ('human', 'ai', 'system')),
  external_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_whatsapp_messages_conv ON crm_whatsapp_messages(conversation_id, created_at);

DO $$ BEGIN
  CREATE TRIGGER crm_whatsapp_conversations_updated_at
    BEFORE UPDATE ON crm_whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
