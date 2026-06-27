"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api/client";
import type { FeatureTreeNode } from "@/types/category-features";
import type { SidebarMenuRecord } from "@/lib/sidebar/types";

type FeaturesResponse = {
  features: SidebarMenuRecord[];
  tree: FeatureTreeNode[];
};

type FeatureFormState = {
  id?: string;
  parentId: string | null;
  name: string;
  slug: string;
  path: string;
  icon: string;
  moduleKey: string;
  menuType: "section" | "group" | "item";
  sortOrder: number;
  isVisible: boolean;
  isActive: boolean;
  isAlwaysVisible: boolean;
};

const EMPTY_FORM: FeatureFormState = {
  parentId: null,
  name: "",
  slug: "",
  path: "",
  icon: "file-text",
  moduleKey: "",
  menuType: "item",
  sortOrder: 0,
  isVisible: true,
  isActive: true,
  isAlwaysVisible: false,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ErpFeatureManager() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FeatureFormState | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["platform", "features"],
    queryFn: () => fetchApi<FeaturesResponse>("/api/platform/features"),
  });

  const save = useMutation({
    mutationFn: (payload: FeatureFormState) => {
      const body = {
        ...payload,
        path: payload.path || null,
        icon: payload.icon || null,
        moduleKey: payload.moduleKey || null,
        menuType: payload.menuType,
      };
      if (payload.id) {
        return fetchApi(`/api/platform/features/${payload.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      return fetchApi("/api/platform/features", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      toast.success("Feature saved");
      qc.invalidateQueries({ queryKey: ["platform", "features"] });
      qc.invalidateQueries({ queryKey: ["feature-tree"] });
      setForm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => fetchApi(`/api/platform/features/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Feature deleted");
      qc.invalidateQueries({ queryKey: ["platform", "features"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleEnabled = useMutation({
    mutationFn: (row: SidebarMenuRecord) =>
      fetchApi(`/api/platform/features/${row.id}`, {
        method: "PUT",
        body: JSON.stringify({
          parentId: row.parentId,
          name: row.name,
          slug: row.slug,
          path: row.path,
          icon: row.icon,
          moduleKey: row.moduleKey,
          menuType: row.menuType,
          sortOrder: row.sortOrder,
          isVisible: row.isVisible,
          isActive: !row.isActive,
          isAlwaysVisible: row.isAlwaysVisible ?? false,
          isSystem: row.isSystem ?? false,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform", "features"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredTree = useMemo(() => {
    if (!data?.tree) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.tree;

    const filterNodes = (nodes: FeatureTreeNode[]): FeatureTreeNode[] =>
      nodes
        .map((n) => {
          const children = filterNodes(n.children);
          const match = n.name.toLowerCase().includes(q) || n.slug.includes(q);
          if (match || children.length) return { ...n, children };
          return null;
        })
        .filter(Boolean) as FeatureTreeNode[];

    return filterNodes(data.tree);
  }, [data?.tree, search]);

  const featureById = useMemo(() => {
    const map = new Map<string, SidebarMenuRecord>();
    for (const f of data?.features ?? []) map.set(f.id, f);
    return map;
  }, [data?.features]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const ids = new Set<string>();
    const walk = (nodes: FeatureTreeNode[]) => {
      for (const n of nodes) {
        if (n.children.length) ids.add(n.id);
        walk(n.children);
      }
    };
    walk(data?.tree ?? []);
    setExpanded(ids);
  };

  const openCreate = (parentId: string | null, menuType: FeatureFormState["menuType"] = "item") => {
    setForm({
      ...EMPTY_FORM,
      parentId,
      menuType,
      sortOrder: (data?.features.filter((f) => f.parentId === parentId).length ?? 0) + 1,
    });
  };

  const openEdit = (node: FeatureTreeNode) => {
    const row = featureById.get(node.id);
    setForm({
      id: node.id,
      parentId: node.parentId,
      name: node.name,
      slug: node.slug,
      path: row?.path ?? "",
      icon: row?.icon ?? "file-text",
      moduleKey: row?.moduleKey ?? "",
      menuType: (row?.menuType ?? node.menuType) as FeatureFormState["menuType"],
      sortOrder: node.sortOrder,
      isVisible: row?.isVisible ?? true,
      isActive: row?.isActive ?? true,
      isAlwaysVisible: row?.isAlwaysVisible ?? false,
    });
  };

  const renderNode = (node: FeatureTreeNode, depth = 0) => {
    const row = featureById.get(node.id);
    const hasChildren = node.children.length > 0;
    const isOpen = expanded.has(node.id) || !!search.trim();
    const inactive = row && !row.isActive;

    return (
      <div key={node.id}>
        <div
          className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-100"
          style={{ paddingLeft: depth * 16 + 8 }}
        >
          <GripVertical className="h-4 w-4 shrink-0 text-slate-600 opacity-0 group-hover:opacity-100" />
          {hasChildren ? (
            <button type="button" onClick={() => toggleExpand(node.id)} className="text-slate-400">
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-medium ${inactive ? "text-slate-400 line-through" : "text-slate-900"}`}>
                {node.name}
              </span>
              <span className="text-xs text-slate-500">{node.slug}</span>
              {row?.path && <span className="text-xs text-indigo-600">{row.path}</span>}
              {!row?.isVisible && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">hidden</span>
              )}
              {row?.isSystem && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">system</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-xs ${row?.isActive ? "text-emerald-600" : "text-slate-500"}`}
              onClick={() => row && toggleEnabled.mutate(row)}
              disabled={!row || toggleEnabled.isPending}
            >
              {row?.isActive ? "Enabled" : "Disabled"}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(node)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => openCreate(node.id, node.menuType === "section" ? "group" : "item")}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            {!row?.isSystem && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-red-600"
                onClick={() => {
                  if (confirm(`Delete ${node.name}?`)) remove.mutate(node.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        {hasChildren && isOpen && node.children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search features..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(new Set())}>
          Collapse All
        </Button>
        <Button type="button" size="sm" onClick={() => openCreate(null, "section")}>
          <Plus className="mr-1 h-4 w-4" /> Add Module
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : isError ? (
        <p className="text-sm text-red-600">{(error as Error).message}</p>
      ) : !filteredTree.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-600">
          No ERP features in database. Run <code className="text-slate-700">npm run db:seed:sidebar</code> once, then
          manage everything here.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          {filteredTree.map((node) => renderNode(node))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">{form.id ? "Edit Feature" : "New Feature"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["name", "Name"],
                  ["slug", "Slug"],
                  ["path", "Route"],
                  ["icon", "Icon"],
                  ["moduleKey", "Module Key"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm">
                  <span className="mb-1 block text-slate-600">{label}</span>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    value={form[key]}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((f) =>
                        f
                          ? {
                              ...f,
                              [key]: value,
                              ...(key === "name" && !f.id ? { slug: slugify(value) } : {}),
                            }
                          : f
                      );
                    }}
                  />
                </label>
              ))}
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Menu Type</span>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  value={form.menuType}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, menuType: e.target.value as FeatureFormState["menuType"] })
                  }
                >
                  <option value="section">Section (root module)</option>
                  <option value="group">Group</option>
                  <option value="item">Item (leaf link)</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Sort Order</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => f && { ...f, sortOrder: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {(
                [
                  ["isVisible", "Visible"],
                  ["isActive", "Enabled"],
                  ["isAlwaysVisible", "Always visible"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm((f) => f && { ...f, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => save.mutate(form)}
                disabled={!form.name || !form.slug || save.isPending}
              >
                Save Feature
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
