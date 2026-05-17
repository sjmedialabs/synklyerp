"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { useAttendance, useAttendanceSummary } from "@/hooks/modules";

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: rows = [], isLoading, error } = useAttendance(date);
  const { data: summary } = useAttendanceSummary(date);

  const badges = [
    { label: "Present", value: summary?.present ?? 0, className: "bg-emerald-100 text-emerald-700" },
    { label: "Late", value: summary?.late ?? 0, className: "bg-amber-100 text-amber-700" },
    { label: "Absent", value: summary?.absent ?? 0, className: "bg-rose-100 text-rose-700" },
    { label: "On Leave", value: summary?.onLeave ?? 0, className: "bg-sky-100 text-sky-700" },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance & Leave"
        description="Daily attendance register and summary for your workforce."
      />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-xs" />
        </div>
        <div className="flex flex-wrap gap-3">
          {badges.map((b) => (
            <div key={b.label} className={`rounded-lg px-4 py-2 text-sm font-medium ${b.className}`}>
              {b.label}: {b.value}
            </div>
          ))}
        </div>
      </div>

      {isLoading && <div className="flex gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
            <tr>
              {["Employee", "Code", "Punch In", "Punch Out", "Status", "OT Hours"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !isLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No attendance records for this date.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{r.employee?.fullName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.employee?.employeeCode ?? "—"}</td>
                  <td className="px-4 py-3">{r.punchIn ? new Date(r.punchIn).toLocaleTimeString() : "—"}</td>
                  <td className="px-4 py-3">{r.punchOut ? new Date(r.punchOut).toLocaleTimeString() : "—"}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">{r.otHours}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
