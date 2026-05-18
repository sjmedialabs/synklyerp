import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { PlanRow } from "./plans";

export async function createSubscriptionForTenant(
  tenantId: string,
  plan: PlanRow,
  billingCycle: "monthly" | "yearly" = "monthly"
) {
  const supabase = createAdminClient();
  const trialEnds =
    plan.trialDays > 0 ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000).toISOString() : null;

  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .insert({
      tenant_id: tenantId,
      plan_id: plan.id,
      status: plan.trialDays > 0 ? "trialing" : "active",
      billing_cycle: billingCycle,
      trial_ends_at: trialEnds,
      current_period_start: new Date().toISOString(),
    })
    .select()
    .single();

  if (subErr) {
    if (isMissingSchemaError(subErr)) {
      await supabase.from("tenants").update({ plan: plan.slug.toUpperCase(), plan_id: plan.id }).eq("id", tenantId);
      return null;
    }
    throw subErr;
  }

  await supabase
    .from("tenants")
    .update({ plan: plan.slug.toUpperCase(), plan_id: plan.id, updated_at: new Date().toISOString() })
    .eq("id", tenantId);

  await supabase.from("subscription_history").insert({
    subscription_id: sub.id,
    event_type: "created",
    to_plan_id: plan.id,
    metadata: { billing_cycle: billingCycle },
  });

  if (plan.modules.length > 0) {
    const rows = plan.modules.map((module_key) => ({
      tenant_id: tenantId,
      module_key,
      is_active: true,
    }));
    await supabase.from("tenant_modules").upsert(rows, { onConflict: "tenant_id,module_key" });
  }

  return sub;
}
