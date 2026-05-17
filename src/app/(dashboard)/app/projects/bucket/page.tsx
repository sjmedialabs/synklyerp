"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUSES } from "@/constants/roles";

type Project = {
  id: string;
  name: string;
  clientName: string;
  managerName?: string | null;
  status: string;
  priority: string;
  progress: number;
  dueDate?: string | null;
  budget?: number | null;
};

async function fetchProjects() {
  const res = await fetch("/api/projects");
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data as Project[];
}

export default function ProjectBucketPage() {
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const stats = PROJECT_STATUSES.map((status) => ({
    status,
    count: projects.filter((p) => p.status === status).length,
  }));

  return (
    <div>
      <PageHeader
        title="Project Bucket"
        description="Plan, track, and deliver client projects."
        actions={
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus size={16} className="mr-2" /> New Project
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(({ status, count }) => (
          <div
            key={status}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500">{status}</p>
            <p className="text-2xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="mb-4 flex items-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading projects...
        </div>
      )}
      {error && <p className="mb-4 text-sm text-rose-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800">
            <tr>
              {["Project", "Client", "Manager", "Status", "Priority", "Progress", "Due", "Budget"].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  No projects yet.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{project.name}</td>
                  <td className="px-4 py-3">{project.clientName}</td>
                  <td className="px-4 py-3">{project.managerName ?? "—"}</td>
                  <td className="px-4 py-3">{project.status}</td>
                  <td className="px-4 py-3">{project.priority}</td>
                  <td className="px-4 py-3">{project.progress}%</td>
                  <td className="px-4 py-3">
                    {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {project.budget != null ? `₹${project.budget.toLocaleString()}` : "—"}
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
