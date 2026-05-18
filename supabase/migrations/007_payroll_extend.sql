-- Extend payroll cycles for computed totals (non-breaking)

ALTER TABLE payroll_cycles ADD COLUMN IF NOT EXISTS employee_count INT NOT NULL DEFAULT 0;
ALTER TABLE payroll_cycles ADD COLUMN IF NOT EXISTS total_gross NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE payroll_cycles ADD COLUMN IF NOT EXISTS total_deductions NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE payroll_cycles ADD COLUMN IF NOT EXISTS total_net NUMERIC(14,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_payroll_cycles_tenant_status ON payroll_cycles(tenant_id, status);
