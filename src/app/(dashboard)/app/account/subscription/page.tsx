"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { fetchApi } from "@/lib/api/client";

type SubscriptionView = {
  planName: string | null;
  planSlug: string | null;
  subscriptionStatus: string | null;
  tenantStatus: string;
  expiresAt: string | null;
  isExpired: boolean;
  isPaymentRequired: boolean;
  billingCycle: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

export default function AccountSubscriptionPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tenant", "subscription"],
    queryFn: () => fetchApi<SubscriptionView>("/api/tenant/subscription"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{(error as Error).message}</p>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Subscription"
        description="Plan details and renewal options for your workspace."
      />

      <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Plan</dt>
            <dd className="font-medium">{data?.planName ?? data?.planSlug ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Subscription status</dt>
            <dd className="font-medium capitalize">{data?.subscriptionStatus ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Tenant access</dt>
            <dd className="font-medium">{data?.tenantStatus ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Trial ends</dt>
            <dd className="font-medium">
              {data?.trialEndsAt ? new Date(data.trialEndsAt).toLocaleDateString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Current period ends</dt>
            <dd className="font-medium">
              {data?.currentPeriodEnd ? new Date(data.currentPeriodEnd).toLocaleDateString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Payment required</dt>
            <dd className="font-medium">{data?.isPaymentRequired ? "Yes" : "No"}</dd>
          </div>
        </dl>

        {data?.isPaymentRequired && (
          <p className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
            Complete payment on the billing page to re-enable ERP modules for all users in this tenant.
          </p>
        )}

        <Link
          href="/app/account/billing"
          className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Go to billing
        </Link>
      </section>
    </div>
  );
}
