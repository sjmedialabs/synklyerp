-- Fix HR Designations sidebar visibility (permission + category assignments)

UPDATE sidebar_menus
SET permission_module = 'hr',
    permission_feature = 'employees',
    is_active = true,
    is_visible = true,
    deleted_at = NULL
WHERE slug = 'hr-designations';

UPDATE sidebar_menus
SET is_active = true,
    is_visible = true,
    deleted_at = NULL
WHERE slug = 'hr-master-data';

-- Enable HR Master Data + Designations for business types that already have HR Employee Management
INSERT INTO business_category_menu_assignments (business_type_id, menu_id, is_enabled)
SELECT DISTINCT e.business_type_id, m.id, true
FROM business_category_menu_assignments e
JOIN sidebar_menus emp ON emp.id = e.menu_id AND emp.slug = 'employees' AND emp.deleted_at IS NULL
JOIN sidebar_menus m ON m.slug IN ('hr-master-data', 'hr-designations') AND m.deleted_at IS NULL
WHERE e.is_enabled = true
  AND NOT EXISTS (
    SELECT 1 FROM business_category_menu_assignments x
    WHERE x.business_type_id = e.business_type_id AND x.menu_id = m.id
  );
