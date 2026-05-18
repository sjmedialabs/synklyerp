-- Phase 7: Row Level Security (defense in depth)
-- Next.js uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS in Supabase.
-- Policies below block direct PostgREST access via anon/authenticated keys.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'tenants',
    'roles',
    'users',
    'branches',
    'divisions',
    'designations',
    'user_permissions',
    'org_taxes',
    'services',
    'pricing_rules',
    'service_packages',
    'service_slas',
    'leads',
    'projects',
    'employees',
    'employee_documents',
    'employee_assets',
    'attendances',
    'leave_policies',
    'payroll_cycles',
    'permissions',
    'role_permissions',
    'activity_logs',
    'login_history',
    'notifications',
    'notification_preferences',
    'files',
    'tenant_modules',
    'tenant_users',
    'otp_verifications',
    'password_reset_tokens',
    'auth_rate_limits',
    'refresh_tokens'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS deny_anon_authenticated ON %I', t);
    EXECUTE format(
      'CREATE POLICY deny_anon_authenticated ON %I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false)',
      t
    );
  END LOOP;
END;
$$;
