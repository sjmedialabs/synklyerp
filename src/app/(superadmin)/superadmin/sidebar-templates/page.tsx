"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

type TemplateRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  business_type_id: string | null;
};

export default function SidebarTemplatesPage() {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["superadmin", "sidebar-templates"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/sidebar-templates", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load templates");
      const json = await res.json();
      return (json.data ?? json) as TemplateRow[];
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sidebar Templates</h1>
        <p className="mt-1 max-w-3xl text-slate-600">
          Templates map business types to sidebar menu subsets. Feature assignment per business type is the primary
          control; templates provide optional additional filtering.
        </p>
      </div>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {["Template", "Slug", "Default", "Active"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">{t.slug}</td>
                  <td className="px-4 py-3">{t.is_default ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{t.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
              {!templates.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No templates found. Run migration 015 to seed default templates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
