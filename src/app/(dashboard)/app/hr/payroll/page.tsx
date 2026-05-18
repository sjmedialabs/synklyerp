"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { fetchApi } from "@/lib/api/client";
import { formatInr } from "@/lib/format/currency";
import type { PayrollCycleRow } from "@/repositories/hr/payroll";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type PayrollStats = {
  totalProcessedYtd: number;
  taxDeductedYtd: number;
  pendingApprovals: number;
  cycleCount: number;
};

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["payroll-stats"],
    queryFn: () => fetchApi<PayrollStats>("/api/hr/payroll/stats"),
  });

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["payroll-cycles"],
    queryFn: () => fetchApi<PayrollCycleRow[]>("/api/hr/payroll/cycles"),
  });

  const generateMutation = useMutation({
    mutationFn: (data: { month: number; year: number }) =>
      fetchApi<PayrollCycleRow>("/api/hr/payroll/cycles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-cycles"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-stats"] });
      setIsModalOpen(false);
      toast.success("Payroll cycle created as draft");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Payroll Management"
        description="Manage payroll cycles, run calculations, and export payslips."
        actions={
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Calendar size={16} className="mr-2" /> Run Payroll Cycle
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label="Total Processed (YTD)"
          value={statsLoading ? "…" : formatInr(stats?.totalProcessedYtd ?? 0, true)}
          icon={<CheckCircle size={20} />}
          tone="emerald"
        />
        <KpiCard
          label="Pending Approvals"
          value={statsLoading ? "…" : String(stats?.pendingApprovals ?? 0)}
          suffix={stats?.pendingApprovals === 1 ? "cycle" : "cycles"}
          icon={<AlertCircle size={20} />}
          tone="amber"
        />
        <KpiCard
          label="Tax Deducted (YTD)"
          value={statsLoading ? "…" : formatInr(stats?.taxDeductedYtd ?? 0, true)}
          icon={<FileText size={20} />}
          tone="blue"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="font-semibold text-slate-900 dark:text-white">Recent Payroll Cycles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Period</th>
                <th className="px-6 py-3 font-medium">Employees</th>
                <th className="px-6 py-3 font-medium">Net payout</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading cycles...
                  </td>
                </tr>
              ) : cycles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No payroll cycles yet. Run your first cycle to generate draft payroll.
                  </td>
                </tr>
              ) : (
                cycles.map((cycle) => (
                  <tr
                    key={cycle.id}
                    className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/25"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {MONTHS[cycle.month - 1]} {cycle.year}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {cycle.employeeCount} employees
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {formatInr(cycle.totalNet)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={cycle.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(cycle.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Run Payroll Cycle</h2>
              <p className="mt-1 text-sm text-slate-500">
                Creates a draft cycle from active employees in your tenant.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                generateMutation.mutate({
                  month: parseInt(formData.get("month") as string, 10),
                  year: parseInt(formData.get("year") as string, 10),
                });
              }}
              className="space-y-4 p-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Month
                  </label>
                  <select
                    name="month"
                    required
                    defaultValue={new Date().getMonth() + 1}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Year
                  </label>
                  <select
                    name="year"
                    required
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value={currentYear}>{currentYear}</option>
                    <option value={currentYear - 1}>{currentYear - 1}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {generateMutation.isPending ? "Generating..." : "Generate Draft"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  icon,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ReactNode;
  tone: "emerald" | "amber" | "blue";
}) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
          {value}
          {suffix && <span className="ml-1 text-base font-normal text-slate-500">{suffix}</span>}
        </h3>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tones[tone]}`}>
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "APPROVED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : status === "DRAFT"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${styles}`}>{status}</span>
  );
}
