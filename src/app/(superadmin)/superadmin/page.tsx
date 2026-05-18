"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

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
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Tenants</h1>
        <p className="mt-1 text-slate-400">Platform overview and tenant management</p>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Clients", value: tenants.length },
          { label: "Active Clients", value: active },
          { label: "Plans", value: new Set(tenants.map((t) => t.plan)).size },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">{kpi.label}</p>
            <p className="mt-2 text-3xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="mb-4 flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading clients...
        </div>
      )}
      {error && <p className="mb-4 text-rose-400">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr>
              {["Company", "Type", "Plan", "Status", "Users", "Branches", "Joined"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-400">
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
  );
}
