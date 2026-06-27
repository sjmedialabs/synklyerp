"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api/client";

type DupItem = {
  id: string;
  incomingPayload: Record<string, unknown>;
  matchedLeadId: string | null;
  matchFields: string[];
  status: string;
  createdAt: string;
};

export default function DuplicateQueuePage() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["crm", "duplicates"],
    queryFn: async () => {
      const res = await fetch("/api/sales/capture/duplicates");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as DupItem[];
    },
  });

  const resolve = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetchApi("/api/sales/capture/duplicates", { method: "PATCH", body: JSON.stringify({ id, status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", "duplicates"] }); toast.success("Resolved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Duplicate Review Queue" description="Review potential duplicate leads matched by email, phone, or company." />

      {isLoading && <div className="flex gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              {["Detected", "Match fields", "Incoming", "Matched lead", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !isLoading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No pending duplicates.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{item.matchFields.join(", ")}</td>
                  <td className="px-4 py-3">{(item.incomingPayload.name as string) ?? (item.incomingPayload.email as string) ?? "—"}</td>
                  <td className="px-4 py-3">
                    {item.matchedLeadId ? (
                      <Link href={`/app/sales/leads/${item.matchedLeadId}`} className="text-indigo-600 hover:underline">View lead</Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(["ignored", "merged", "created"] as const).map((s) => (
                        <Button key={s} type="button" variant="outline" size="sm" onClick={() => resolve.mutate({ id: item.id, status: s })}>
                          {s}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
