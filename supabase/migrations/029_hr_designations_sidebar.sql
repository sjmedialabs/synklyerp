-- HR Master Data > Designations menu (does not remove Organisation Setup entry)

INSERT INTO sidebar_menus (slug, name, path, icon, menu_type, sort_order, status, permission_module, permission_feature, parent_id)
SELECT
  'hr-master-data',
  'Master Data',
  NULL,
  'database',
  'group',
  2,
  'built',
  'hr',
  'employees',
  p.id
FROM sidebar_menus p
WHERE p.slug = 'hr' AND p.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM sidebar_menus c WHERE c.slug = 'hr-master-data' AND c.deleted_at IS NULL);

INSERT INTO sidebar_menus (slug, name, path, icon, menu_type, sort_order, status, permission_module, permission_feature, parent_id)
SELECT
  'hr-designations',
  'Designations',
  '/app/hr/master-data/designations',
  'badge-check',
  'item',
  1,
  'built',
  'organisation',
  'designations',
  g.id
FROM sidebar_menus g
WHERE g.slug = 'hr-master-data' AND g.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM sidebar_menus c WHERE c.slug = 'hr-designations' AND c.deleted_at IS NULL);
