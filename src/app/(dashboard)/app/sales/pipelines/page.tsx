"use client";

import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

type Pipeline = {
  id: string;
  name: string;
  industry: string | null;
  isDefault: boolean;
  stages: { id: string; name: string; probability: number; color: string; sortOrder: number }[];
};

export default function SalesPipelinesPage() {
  const { data: pipelines = [], isLoading, refetch } = useQuery({
    queryKey: ["crm", "pipelines"],
    queryFn: async () => {
      const res = await fetch("/api/sales/capture/pipelines?seed=1");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as Pipeline[];
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales Pipelines"
        description="Configure pipeline stages, probability, and expected cycle times."
        actions={<Button variant="outline" onClick={() => refetch()}>Refresh</Button>}
      />

      {isLoading && <div className="flex gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}

      {pipelines.map((pipeline) => (
        <section key={pipeline.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-semibold">{pipeline.name}</h2>
            {pipeline.isDefault && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">Default</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {pipeline.stages.map((stage) => (
              <div
                key={stage.id}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: stage.color, backgroundColor: `${stage.color}15` }}
              >
                <p className="font-medium">{stage.name}</p>
                <p className="text-xs text-slate-500">{stage.probability}% probability</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
