"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  FeatureAssignmentSearch,
  FeatureAssignmentTree,
} from "@/components/superadmin/feature-assignment-tree";
import { fetchApi } from "@/lib/api/client";
import type { FeatureTreeNode } from "@/types/category-features";

type FeaturesResponse = {
  tree: FeatureTreeNode[];
  enabledMenuIds: string[];
};

type BusinessTypeRow = {
  id: string;
  name: string;
  slug: string;
};

function setsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

export default function BusinessCategoryFeaturesPage() {
  const params = useParams<{ slug: string }>();
  const categorySlug = params.slug;
  const qc = useQueryClient();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const { data: typeRow } = useQuery({
    queryKey: ["superadmin", "business-types"],
    queryFn: () => fetchApi<BusinessTypeRow[]>("/api/superadmin/business-types"),
    select: (rows) => rows.find((r) => r.slug === categorySlug),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["superadmin", "category-features", categorySlug],
    queryFn: () => fetchApi<FeaturesResponse>(`/api/platform/business-types/${categorySlug}/features`),
    enabled: !!categorySlug,
  });

  useEffect(() => {
    if (data?.enabledMenuIds) {
      const initial = new Set(data.enabledMenuIds);
      setSelected(initial);
      setSaved(initial);
    }
  }, [data?.enabledMenuIds]);

  const dirty = useMemo(() => !setsEqual(selected, saved), [selected, saved]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = useMutation({
    mutationFn: async () => {
      const assignments = [...selected].map((menuId) => ({ menuId, isEnabled: true }));
      return fetchApi<{ enabledMenuIds: string[] }>(
        `/api/platform/business-types/${categorySlug}/features`,
        {
          method: "PUT",
          body: JSON.stringify({ assignments }),
        }
      );
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["superadmin", "category-features", categorySlug] });
      const prev = qc.getQueryData<FeaturesResponse>(["superadmin", "category-features", categorySlug]);
      qc.setQueryData<FeaturesResponse>(["superadmin", "category-features", categorySlug], (old) =>
        old ? { ...old, enabledMenuIds: [...selected] } : old
      );
      return { prev };
    },
    onSuccess: (result) => {
      const next = new Set(result.enabledMenuIds);
      setSaved(next);
      setSelected(next);
      toast.success("Feature assignments saved");
      qc.invalidateQueries({ queryKey: ["superadmin", "category-features", categorySlug] });
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["superadmin", "category-features", categorySlug], ctx.prev);
      }
      toast.error(e.message || "Failed to save assignments");
    },
  });

  const handleSave = useCallback(() => {
    if (!dirty) return;
    save.mutate();
  }, [dirty, save]);

  return (
    <div className="pb-24">
      <div className="mb-6">
        <Link
          href="/superadmin/business-types"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to business categories
        </Link>
        <h1 className="text-3xl font-bold">Assign Features to Category</h1>
        <p className="mt-1 max-w-3xl text-slate-600">
          Select menus and submenus for{" "}
          <strong className="text-slate-900">{typeRow?.name ?? categorySlug}</strong>. Checking a menu selects all
          submenus. Uncheck a menu to remove all submenus. You can deselect individual submenus — the parent menu shows
          an indeterminate state.
        </p>
      </div>

      <FeatureAssignmentSearch value={search} onChange={setSearch} />

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-red-600">{(error as Error).message}</p>
        ) : data?.tree ? (
          <FeatureAssignmentTree
            tree={data.tree}
            selectedIds={selected}
            onChange={setSelected}
            searchQuery={search}
          />
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <p className="text-sm text-slate-600">
            {dirty ? "You have unsaved changes" : "All changes saved"}
          </p>
          <Button onClick={handleSave} disabled={!dirty || save.isPending} className="gap-2">
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save assignments
          </Button>
        </div>
      </div>
    </div>
  );
}
