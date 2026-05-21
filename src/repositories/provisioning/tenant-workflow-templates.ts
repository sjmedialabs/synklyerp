import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { WorkflowTemplateConfig } from "@/business-configs/types";

export async function replaceTenantWorkflowTemplates(tenantId: string, workflows: WorkflowTemplateConfig[]) {
  const supabase = createAdminClient();
  const { error: delErr } = await supabase.from("tenant_workflow_templates").delete().eq("tenant_id", tenantId);
  if (delErr && !isMissingSchemaError(delErr)) throw delErr;
  if (isMissingSchemaError(delErr)) return;

  if (!workflows.length) return;

  const now = new Date().toISOString();
  const payload = workflows.map((w) => ({
    tenant_id: tenantId,
    workflow_code: w.workflowCode,
    workflow_json: { name: w.name, steps: w.steps },
    updated_at: now,
  }));

  const { error } = await supabase.from("tenant_workflow_templates").insert(payload);
  if (error) throw error;
}

export async function listTenantWorkflowTemplates(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenant_workflow_templates")
    .select("workflow_code, workflow_json")
    .eq("tenant_id", tenantId);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  return data ?? [];
}
