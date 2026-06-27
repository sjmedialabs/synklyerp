import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type TenantSubscriptionView = {
  planSlug: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  tenantStatus: string;
  expiresAt: string | null;
  isExpired: boolean;
  isPaymentRequired: boolean;
  billingCycle: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

const PAYMENT_ALLOWED_PREFIXES = ["/app", "/app/account/billing", "/app/account/subscription"];

export function isPathAllowedWhenSubscriptionExpired(pathname: string): boolean {
  if (pathname === "/app") return true;
  return PAYMENT_ALLOWED_PREFIXES.some(
    (p) => p !== "/app" && (pathname === p || pathname.startsWith(`${p}/`))
  );
}

function computeExpiry(sub: {
  trial_ends_at: string | null;
  current_period_end: string | null;
  status: string;
}): { expiresAt: string | null; isExpired: boolean } {
  const now = Date.now();
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : null;
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;

  if (sub.status === "trialing" && trialEnd) {
    return {
      expiresAt: sub.trial_ends_at,
      isExpired: trialEnd < now,
    };
  }

  if (periodEnd) {
    return {
      expiresAt: sub.current_period_end,
      isExpired: periodEnd < now && !["active", "trialing"].includes(sub.status),
    };
  }

  if (trialEnd) {
    return {
      expiresAt: sub.trial_ends_at,
      isExpired: trialEnd < now,
    };
  }

  return { expiresAt: null, isExpired: false };
}

/** Sync expired subscriptions → tenant INACTIVE */
export async function syncTenantSubscriptionState(tenantId: string): Promise<TenantSubscriptionView> {
  const supabase = createAdminClient();

  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("id, status, plan, plan_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantErr) throw tenantErr;
  if (!tenant) throw new Error("NOT_FOUND");

  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .select("id, status, billing_cycle, trial_ends_at, current_period_end, plan_id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subErr && !isMissingSchemaError(subErr)) throw subErr;

  let planSlug: string | null = (tenant as { plan?: string }).plan ?? null;
  let planName: string | null = planSlug;

  if (sub?.plan_id) {
    const { data: plan } = await supabase
      .from("plans")
      .select("slug, name")
      .eq("id", sub.plan_id)
      .maybeSingle();
    if (plan) {
      planSlug = (plan as { slug: string }).slug;
      planName = (plan as { name: string }).name;
    }
  }

  if (!sub) {
    return {
      planSlug,
      planName,
      subscriptionStatus: null,
      tenantStatus: (tenant as { status: string }).status,
      expiresAt: null,
      isExpired: false,
      isPaymentRequired: false,
      billingCycle: null,
      trialEndsAt: null,
      currentPeriodEnd: null,
    };
  }

  const row = sub as {
    id: string;
    status: string;
    billing_cycle: string | null;
    trial_ends_at: string | null;
    current_period_end: string | null;
  };

  const { expiresAt, isExpired } = computeExpiry(row);
  const tenantStatus = (tenant as { status: string }).status;

  if (isExpired && tenantStatus === "ACTIVE") {
    const now = new Date().toISOString();
    await supabase.from("tenants").update({ status: "INACTIVE", updated_at: now }).eq("id", tenantId);
    await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: now })
      .eq("id", row.id);
  }

  const isPaymentRequired =
    isExpired || tenantStatus === "INACTIVE" || row.status === "past_due" || row.status === "expired";

  return {
    planSlug,
    planName,
    subscriptionStatus: isExpired ? "expired" : row.status,
    tenantStatus: isExpired ? "INACTIVE" : tenantStatus,
    expiresAt,
    isExpired,
    isPaymentRequired,
    billingCycle: row.billing_cycle,
    trialEndsAt: row.trial_ends_at,
    currentPeriodEnd: row.current_period_end,
  };
}

export async function getTenantSubscriptionView(tenantId: string): Promise<TenantSubscriptionView> {
  return syncTenantSubscriptionState(tenantId);
}
