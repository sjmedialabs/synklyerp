-- HR Designations: department, grade level, reporting hierarchy

ALTER TABLE designations ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE designations ADD COLUMN IF NOT EXISTS grade_level TEXT;
ALTER TABLE designations ADD COLUMN IF NOT EXISTS reports_to_designation_id UUID REFERENCES designations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_designations_department ON designations(tenant_id, department) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_designations_grade_level ON designations(tenant_id, grade_level) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_designations_reports_to ON designations(reports_to_designation_id) WHERE deleted_at IS NULL;
