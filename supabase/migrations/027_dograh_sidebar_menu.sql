-- Add Dograh AI Voice setup to Organisation Setup sidebar
INSERT INTO sidebar_menus (slug, name, path, icon, menu_type, sort_order, status, parent_id)
SELECT
  'dograh-ai',
  'Dograh AI Voice',
  '/app/setup/organisation/dograh',
  'bot',
  'item',
  5,
  'built',
  p.id
FROM sidebar_menus p
WHERE p.slug = 'setup' AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM sidebar_menus c WHERE c.slug = 'dograh-ai' AND c.deleted_at IS NULL
  );
