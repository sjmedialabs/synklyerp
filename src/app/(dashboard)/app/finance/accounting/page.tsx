"use client";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function Page() {
  return (
    <ModulePlaceholder
      title="Accounting"
      status="phase"
      phase={4}
      features={[
        "Chart of accounts and journal entries",
        "General ledger and trial balance",
        "Profit & loss and balance sheet",
        "Cash flow statements",
        "Multi-currency support",
      ]}
    />
  );
}
