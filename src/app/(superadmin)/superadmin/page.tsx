"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TenantRow = {
  id: string;
  name: string;
  businessType: string;
  plan: string;
  status: string;
  contactEmail?: string | null;
  usersCount: number;
  branchesCount: number;
  createdAt: string;
};

async function fetchTenants() {
  const res = await fetch("/api/superadmin/tenants");
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data as TenantRow[];
}

export default function SuperAdminPage() {
  const { data: tenants = [], isLoading, error } = useQuery({
    queryKey: ["superadmin-tenants"],
    queryFn: fetchTenants,
  });

  const active = tenants.filter((t) => t.status === "ACTIVE").length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Super Admin</h1>
            <p className="text-slate-400 mt-1">Platform overview and tenant management</p>
          </div>
          <Link
            href="/api/auth/signout"
            className="inline-flex h-9 items-center rounded-lg border border-slate-700 px-4 text-sm text-white hover:bg-slate-800"
          >
            Sign Out
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Clients", value: tenants.length },
            { label: "Active Clients", value: active },
            { label: "Plans", value: new Set(tenants.map((t) => t.plan)).size },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-slate-400 text-sm">{kpi.label}</p>
              <p className="text-3xl font-bold mt-2">{kpi.value}</p>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 mb-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading clients...
          </div>
        )}
        {error && <p className="text-rose-400 mb-4">{(error as Error).message}</p>}

        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                {["Company", "Type", "Plan", "Status", "Users", "Branches", "Joined"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-slate-400 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3">{tenant.businessType}</td>
                  <td className="px-4 py-3">{tenant.plan}</td>
                  <td className="px-4 py-3">{tenant.status}</td>
                  <td className="px-4 py-3">{tenant.usersCount}</td>
                  <td className="px-4 py-3">{tenant.branchesCount}</td>
                  <td className="px-4 py-3">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
