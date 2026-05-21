"use client";

import { Loader2 } from "lucide-react";

type ProvisioningLoaderProps = {
  message?: string;
};

export function ProvisioningLoader({ message = "Configuring your ERP environment..." }: ProvisioningLoaderProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm dark:border-indigo-900/40 dark:bg-slate-900">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Provisioning workspace</h2>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">{message}</p>
      <ul className="mt-6 space-y-2 text-left text-xs text-slate-500">
        <li>• Activating ERP modules</li>
        <li>• Configuring dashboards and workflows</li>
        <li>• Applying role templates and permissions</li>
      </ul>
    </div>
  );
}
