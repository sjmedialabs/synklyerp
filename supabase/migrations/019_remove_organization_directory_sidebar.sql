-- Remove Organization Directory hub only from sidebar (keep branches, divisions, etc.)

UPDATE sidebar_menus
SET
  is_active = FALSE,
  is_visible = FALSE,
  deleted_at = COALESCE(deleted_at, NOW())
WHERE slug = 'organisation-hub'
  AND deleted_at IS NULL;

-- Restore organisation directory items if they were previously hidden
UPDATE sidebar_menus
SET
  is_active = TRUE,
  is_visible = TRUE,
  deleted_at = NULL
WHERE slug IN ('branches', 'divisions', 'designations', 'users', 'taxes');
