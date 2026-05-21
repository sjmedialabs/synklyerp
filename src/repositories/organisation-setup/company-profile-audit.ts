import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export async function writeCompanyProfileAuditLog(input: {
  tenantId: string;
  companyProfileId: string | null;
  action: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  performedBy: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("company_profile_audit_logs").insert({
    tenant_id: input.tenantId,
    company_profile_id: input.companyProfileId,
    action: input.action,
    old_data: input.oldData ?? null,
    new_data: input.newData ?? null,
    performed_by: input.performedBy,
  });
  if (error && !isMissingSchemaError(error)) throw error;
}
