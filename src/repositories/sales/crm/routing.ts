import { createAdminClient } from "@/lib/supabase/admin";
import { updateLead } from "@/repositories/sales/leads";

export type RoutingRule = {
  id: string;
  tenantId: string;
  name: string;
  ruleType: string;
  priority: number;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  isActive: boolean;
};

function mapRule(row: Record<string, unknown>): RoutingRule {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    ruleType: row.rule_type as string,
    priority: Number(row.priority ?? 0),
    conditions: (row.conditions as Record<string, unknown>) ?? {},
    actions: (row.actions as Record<string, unknown>) ?? {},
    isActive: Boolean(row.is_active),
  };
}

export async function listRoutingRules(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_pipeline_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRule);
}

export async function createRoutingRule(tenantId: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_pipeline_rules")
    .insert({
      tenant_id: tenantId,
      name: String(input.name),
      rule_type: String(input.ruleType),
      priority: input.priority ?? 0,
      conditions: input.conditions ?? {},
      actions: input.actions ?? {},
      is_active: input.isActive ?? true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRule(data);
}

export async function updateRoutingRule(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name;
  if (input.ruleType !== undefined) payload.rule_type = input.ruleType;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.conditions !== undefined) payload.conditions = input.conditions;
  if (input.actions !== undefined) payload.actions = input.actions;
  if (input.isActive !== undefined) payload.is_active = input.isActive;

  const { data, error } = await supabase
    .from("crm_pipeline_rules")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapRule(data);
}

async function getTenantUsers(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at");
  return data ?? [];
}

async function getLeadCountsByAssignee(tenantId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("leads")
    .select("assigned_to")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .not("assigned_to", "is", null);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.assigned_to as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export async function applyLeadRouting(tenantId: string, leadId: string, context: Record<string, unknown>) {
  const rules = (await listRoutingRules(tenantId)).filter((r) => r.isActive);
  if (!rules.length) return null;

  const users = await getTenantUsers(tenantId);
  if (!users.length) return null;

  for (const rule of rules) {
    if (!matchesConditions(rule.conditions, context)) continue;

    let assigneeId: string | null = null;

    if (rule.ruleType === "round_robin") {
      const cursor = Number(rule.actions.cursor ?? 0);
      assigneeId = users[cursor % users.length]?.id as string;
      await updateRoutingRule(tenantId, rule.id, {
        actions: { ...rule.actions, cursor: cursor + 1 },
      });
    } else if (rule.ruleType === "least_loaded") {
      const counts = await getLeadCountsByAssignee(tenantId);
      assigneeId = users.reduce((best, u) => {
        const c = counts[u.id as string] ?? 0;
        const bc = counts[best.id as string] ?? 0;
        return c < bc ? u : best;
      }).id as string;
    } else if (rule.ruleType === "source" && context.source) {
      const map = rule.actions.sourceMap as Record<string, string> | undefined;
      assigneeId = map?.[String(context.source)] ?? (rule.actions.assignTo as string) ?? null;
    } else if (rule.actions.assignTo) {
      assigneeId = String(rule.actions.assignTo);
    }

    if (assigneeId) {
      await updateLead(tenantId, leadId, { assignedTo: assigneeId });
      return assigneeId;
    }
  }
  return null;
}

function matchesConditions(conditions: Record<string, unknown>, context: Record<string, unknown>) {
  if (!conditions || Object.keys(conditions).length === 0) return true;
  for (const [key, value] of Object.entries(conditions)) {
    if (context[key] !== value) return false;
  }
  return true;
}
