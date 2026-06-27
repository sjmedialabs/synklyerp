"use client";

import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";
import { useSession } from "next-auth/react";

export function SubscriptionPaymentAlert() {
  const { data: session } = useSession();
  const required = session?.user?.isPaymentRequired === true;

  if (!required) return null;

  const expiresAt = session?.user?.expiresAt;
  const expiryLabel = expiresAt ? new Date(expiresAt).toLocaleDateString() : "recently";

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3 text-sm text-amber-950 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Your subscription expired on <strong>{expiryLabel}</strong>. ERP modules are disabled until payment is
            completed. Dashboard access remains available.
          </p>
        </div>
        <Link
          href="/app/account/billing"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
        >
          <CreditCard className="h-4 w-4" />
          Pay now
        </Link>
      </div>
    </div>
  );
}
