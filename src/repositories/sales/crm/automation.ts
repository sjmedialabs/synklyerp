import { createAdminClient } from "@/lib/supabase/admin";
import { logLeadActivity } from "@/repositories/sales/crm/lead-attribution";
import { updateLead } from "@/repositories/sales/leads";

export type AutomationRule = {
  id: string;
  tenantId: string;
  name: string;
  triggerEvent: string;
  conditions: unknown[];
  actions: unknown[];
  isActive: boolean;
};

function mapAuto(row: Record<string, unknown>): AutomationRule {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    triggerEvent: row.trigger_event as string,
    conditions: (row.conditions as unknown[]) ?? [],
    actions: (row.actions as unknown[]) ?? [],
    isActive: Boolean(row.is_active),
  };
}

export async function listAutomationRules(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_automation_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAuto);
}

export async function createAutomationRule(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_automation_rules")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      trigger_event: String(input.triggerEvent),
      conditions: input.conditions ?? [],
      actions: input.actions ?? [],
      delays: input.delays ?? [],
      is_active: input.isActive ?? true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapAuto(data);
}

export async function runAutomationRules(
  tenantId: string,
  triggerEvent: string,
  leadId: string,
  context: Record<string, unknown>
) {
  const rules = (await listAutomationRules(tenantId)).filter(
    (r) => r.isActive && r.triggerEvent === triggerEvent
  );
  const supabase = createAdminClient();

  for (const rule of rules) {
    if (!passesConditions(rule.conditions, context)) continue;

    for (const action of rule.actions as Record<string, unknown>[]) {
      const type = String(action.type ?? "");
      if (type === "assign" && action.userId) {
        await updateLead(tenantId, leadId, { assignedTo: String(action.userId) });
        await logLeadActivity({
          tenantId,
          leadId,
          activityType: "automation_assigned",
          title: "Auto-assigned by workflow",
          description: rule.name,
          metadata: { ruleId: rule.id },
        });
      } else if (type === "set_status" && action.status) {
        await updateLead(tenantId, leadId, { status: String(action.status) });
        await logLeadActivity({
          tenantId,
          leadId,
          activityType: "automation_status",
          title: "Status updated by automation",
          description: `${rule.name} → ${action.status}`,
          metadata: { ruleId: rule.id },
        });
      } else if (type === "add_note" && action.note) {
        await logLeadActivity({
          tenantId,
          leadId,
          activityType: "note_added",
          title: "Automation note",
          description: String(action.note),
          metadata: { ruleId: rule.id },
        });
      } else if (type === "send_template" && action.templateId) {
        const { sendTemplateToLead } = await import("@/lib/crm/communication-service");
        await sendTemplateToLead(tenantId, leadId, String(action.templateId));
      }
    }

    await supabase.from("crm_automation_logs").insert({
      tenant_id: tenantId,
      rule_id: rule.id,
      lead_id: leadId,
      status: "executed",
      detail: { triggerEvent, context },
    });
  }
}

function passesConditions(conditions: unknown[], context: Record<string, unknown>) {
  if (!conditions.length) return true;
  return conditions.every((c) => {
    const cond = c as Record<string, unknown>;
    const field = String(cond.field ?? "");
    const op = String(cond.op ?? "eq");
    const value = cond.value;
    if (op === "eq") return context[field] === value;
    if (op === "contains") return String(context[field] ?? "").includes(String(value));
    return true;
  });
}
