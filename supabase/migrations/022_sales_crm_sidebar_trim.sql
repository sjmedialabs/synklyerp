-- Hide non-core Sales & CRM sidebar items (routes remain accessible by URL)

UPDATE sidebar_menus
SET is_active = false, is_visible = false, deleted_at = NOW()
WHERE slug IN (
  'crm-pipelines',
  'crm-automation',
  'crm-duplicates',
  'crm-reports',
  'crm-communication',
  'crm-campaigns',
  'opportunities',
  'quotations',
  'orders',
  'customers',
  'targets',
  'api-forms',
  'customer-support'
)
AND deleted_at IS NULL;
