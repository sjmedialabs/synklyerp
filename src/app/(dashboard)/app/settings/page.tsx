"use client";

import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/shared/page-header";
import { Input, Label } from "@/components/ui/input";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div>
      <PageHeader title="Settings" description="Account and workspace preferences." />
      <div className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
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
          <Input readOnly value={session?.user?.tenantName ?? "Platform"} />
        </div>
        <p className="text-sm text-slate-500">
          Notification preferences, MFA, and security settings will be available in Phase 3.
        </p>
      </div>
    </div>
  );
}
