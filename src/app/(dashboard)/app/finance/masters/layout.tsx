"use client";

import { FinanceMastersShell } from "@/modules/finance/components/masters-shell";

export default function FinanceMastersLayout({ children }: { children: React.ReactNode }) {
  return <FinanceMastersShell>{children}</FinanceMastersShell>;
}
