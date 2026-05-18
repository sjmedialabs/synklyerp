"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { secureSignOut } from "@/lib/auth/client";
import { useTenantModules } from "@/hooks/tenant/use-tenant-modules";
import { moduleLabel } from "@/lib/modules/activation";
import type { ErpModuleKey } from "@/constants/onboarding";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const { data: modules = [], isLoading: modulesLoading } = useTenantModules();
  const sessionModules = session?.user?.enabledModules ?? modules;

  return (
    <div>
      <PageHeader title="Settings" description="Account and workspace preferences." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</h3>
          <div>
            <Label>Name</Label>
            <Input readOnly value={session?.user?.name ?? ""} />
          </div>
          <div>
            <Label>Email</Label>
            <Input readOnly value={session?.user?.email ?? ""} />
          </div>
          <div>
            <Label>Role</Label>
            <Input readOnly value={session?.user?.role ?? ""} />
          </div>
          <div>
            <Label>Tenant</Label>
            <Input readOnly value={session?.user?.tenantName ?? "Workspace"} />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Workspace modules</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Active modules for this tenant. Admins can review business type and module preview in setup.
          </p>
          {modulesLoading ? (
            <p className="text-sm text-slate-500">Loading modules…</p>
          ) : sessionModules.length === 0 ? (
            <p className="text-sm text-slate-500">No modules enabled yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {sessionModules.map((key) => (
                <li
                  key={key}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200"
                >
                  {moduleLabel(key as ErpModuleKey)}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/app/setup/business-type"
            className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            Open business setup →
          </Link>
        </div>
      </div>

      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Session</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Signing out revokes your refresh token on this device and ends your session.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={signingOut}
          className="mt-4 gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
          onClick={async () => {
            setSigningOut(true);
            try {
              await secureSignOut();
            } finally {
              setSigningOut(false);
            }
          }}
        >
          {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          Sign out
        </Button>
      </div>
    </div>
  );
}
