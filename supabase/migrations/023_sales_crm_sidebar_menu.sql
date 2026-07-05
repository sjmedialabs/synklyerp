-- Sales & CRM sidebar: only Lead Management, Orders, Customers, Targets, API & Forms

UPDATE sidebar_menus
SET is_active = false, is_visible = false, deleted_at = NOW()
WHERE slug IN (
  'lead-capture-hub',
  'crm-pipelines',
  'crm-automation',
  'crm-duplicates',
  'crm-reports',
  'crm-communication',
  'crm-campaigns',
  'opportunities',
  'quotations',
  'customer-support'
)
AND deleted_at IS NULL;

UPDATE sidebar_menus
SET is_active = true, is_visible = true, deleted_at = NULL
WHERE slug IN ('orders', 'customers', 'targets', 'api-forms')
AND deleted_at IS NOT NULL;
