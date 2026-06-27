"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeatureTreeNode } from "@/types/category-features";

export type CheckState = "checked" | "unchecked" | "indeterminate";

type Props = {
  tree: FeatureTreeNode[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
  searchQuery?: string;
  expandedIds?: Set<string>;
  onExpandedChange?: (next: Set<string>) => void;
};

function collectSubtreeIds(node: FeatureTreeNode): string[] {
  return [node.id, ...node.children.flatMap(collectSubtreeIds)];
}

export function getNodeCheckState(node: FeatureTreeNode, selected: Set<string>): CheckState {
  const ids = collectSubtreeIds(node);
  const count = ids.filter((id) => selected.has(id)).length;
  if (count === 0) return "unchecked";
  if (count === ids.length) return "checked";
  return "indeterminate";
}

function filterTree(nodes: FeatureTreeNode[], query: string): FeatureTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  return nodes
    .map((node) => {
      const children = filterTree(node.children, q);
      const selfMatch =
        node.name.toLowerCase().includes(q) || node.slug.toLowerCase().includes(q);
      if (selfMatch || children.length) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean) as FeatureTreeNode[];
}

function collectAllIds(nodes: FeatureTreeNode[]): string[] {
  return nodes.flatMap((n) => collectSubtreeIds(n));
}

export function FeatureAssignmentTree({
  tree,
  selectedIds,
  onChange,
  searchQuery = "",
  expandedIds: controlledExpanded,
  onExpandedChange,
}: Props) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(() => new Set());
  const expanded = controlledExpanded ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;

  const filtered = useMemo(() => filterTree(tree, searchQuery), [tree, searchQuery]);

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const toggleNode = (node: FeatureTreeNode, enabled: boolean) => {
    const subtree = collectSubtreeIds(node);
    const next = new Set(selectedIds);
    for (const id of subtree) {
      if (enabled) next.add(id);
      else next.delete(id);
    }
    onChange(next);
  };

  /** Toggle single leaf/submenu without affecting siblings */
  const toggleLeaf = (node: FeatureTreeNode, enabled: boolean) => {
    const next = new Set(selectedIds);
    if (enabled) next.add(node.id);
    else next.delete(node.id);
    onChange(next);
  };

  const nodeKind = (node: FeatureTreeNode, depth: number) => {
    if (depth === 0 || node.menuType === "section") return "Menu";
    if (node.children.length > 0) return "Group";
    return "Submenu";
  };

  const expandAll = () => {
    const all = new Set<string>();
    const walk = (nodes: FeatureTreeNode[]) => {
      for (const n of nodes) {
        if (n.children.length) {
          all.add(n.id);
          walk(n.children);
        }
      }
    };
    walk(tree);
    setExpanded(all);
  };

  const collapseAll = () => setExpanded(new Set());

  const renderNode = (node: FeatureTreeNode, depth = 0) => {
    const state = getNodeCheckState(node, selectedIds);
    const hasChildren = node.children.length > 0;
    const isOpen = expanded.has(node.id) || !!searchQuery.trim();

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-100",
            depth > 0 && "ml-4 border-l border-slate-200 pl-3"
          )}
          style={{ paddingLeft: depth * 12 + 8 }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="text-slate-500 hover:text-slate-700"
              onClick={() => toggleExpand(node.id)}
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          <label className="flex flex-1 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              ref={(el) => {
                if (el) el.indeterminate = state === "indeterminate";
              }}
              checked={state === "checked"}
              onChange={(e) => {
                const on = e.target.checked;
                if (hasChildren) toggleNode(node, on);
                else toggleLeaf(node, on);
              }}
              className="h-4 w-4 rounded border-slate-300 bg-white"
            />
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
              {nodeKind(node, depth)}
            </span>
            <span className="font-medium text-slate-900">{node.name}</span>
            <span className="text-xs text-slate-500">{node.slug}</span>
          </label>
        </div>

        {hasChildren && isOpen && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (!tree.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
        No ERP features found. Run sidebar menu seed first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(new Set(collectAllIds(tree)))}
        >
          Select All
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(new Set())}>
          Clear All
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {filtered.map((node) => renderNode(node))}
      </div>
    </div>
  );
}

export function FeatureAssignmentSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        placeholder="Search menus and submenus..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
      />
    </div>
  );
}
