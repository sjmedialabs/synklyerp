"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CreditCard, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { fetchApi } from "@/lib/api/client";

type BillingResponse = {
  subscription: {
    planName: string | null;
    planSlug: string | null;
    subscriptionStatus: string | null;
    tenantStatus: string;
    expiresAt: string | null;
    isExpired: boolean;
    isPaymentRequired: boolean;
    billingCycle: string | null;
  };
  history: { eventType: string; createdAt: string; metadata: Record<string, unknown> }[];
};

export default function AccountBillingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tenant", "billing"],
    queryFn: () => fetchApi<BillingResponse>("/api/tenant/billing"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading billing...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{(error as Error).message}</p>;
  }

  const sub = data?.subscription;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Billing"
        description="Review subscription status and renew access to ERP modules."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">Current plan</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Plan</dt>
              <dd className="font-medium">{sub?.planName ?? sub?.planSlug ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium capitalize">{sub?.subscriptionStatus ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Expires</dt>
              <dd className="font-medium">
                {sub?.expiresAt ? new Date(sub.expiresAt).toLocaleString() : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Billing cycle</dt>
              <dd className="font-medium capitalize">{sub?.billingCycle ?? "—"}</dd>
            </div>
          </dl>

          {sub?.isPaymentRequired && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Payment is required to restore full ERP access for your organisation.
            </div>
          )}

          <Link
            href="/app/account/subscription"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <CreditCard className="h-4 w-4" />
            Manage subscription
          </Link>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">Billing history</h2>
          {!data?.history.length ? (
            <p className="mt-3 text-sm text-slate-500">No billing events recorded yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {data.history.map((row) => (
                <li key={`${row.eventType}-${row.createdAt}`} className="flex justify-between py-2 text-sm">
                  <span className="capitalize">{row.eventType.replace(/_/g, " ")}</span>
                  <span className="text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
