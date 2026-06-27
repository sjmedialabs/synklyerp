import { apiError, apiSuccess } from "@/lib/api/response";
import { getTenantSubscriptionView } from "@/lib/platform/tenant-subscription-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.settings.read, { req });
    const [subscription, history] = await Promise.all([
      getTenantSubscriptionView(tenantId),
      loadBillingHistory(tenantId),
    ]);
    return apiSuccess({ subscription, history });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

async function loadBillingHistory(tenantId: string) {
  const supabase = createAdminClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return [];

  const { data } = await supabase
    .from("subscription_history")
    .select("event_type, created_at, metadata")
    .eq("subscription_id", (sub as { id: string }).id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => ({
    eventType: (row as { event_type: string }).event_type,
    createdAt: (row as { created_at: string }).created_at,
    metadata: (row as { metadata: unknown }).metadata ?? {},
  }));
}
