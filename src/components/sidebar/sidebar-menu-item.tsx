"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveSidebarIcon } from "@/lib/sidebar/icon-map";
import type { RenderedSidebarMenu } from "@/lib/sidebar/types";
import { useTrackRecentMenu } from "@/hooks/useSidebar";

type SidebarMenuItemProps = {
  item: RenderedSidebarMenu;
  depth?: number;
  collapsed?: boolean;
  favorites?: Set<string>;
  globalExpand?: "expand" | "collapse" | null;
  onToggleFavorite?: (slug: string) => void;
  onNavigate?: () => void;
};

function hasActiveChild(pathname: string, item: RenderedSidebarMenu): boolean {
  if (item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`))) return true;
  return item.children.some((child) => hasActiveChild(pathname, child));
}

export const SidebarMenuItem = memo(function SidebarMenuItem({
  item,
  depth = 0,
  collapsed,
  favorites,
  globalExpand,
  onToggleFavorite,
  onNavigate,
}: SidebarMenuItemProps) {
  const pathname = usePathname();
  const hasChildren = item.children.length > 0;
  const childActive = hasActiveChild(pathname, item);
  const [open, setOpen] = useState(hasChildren && childActive);
  const trackRecent = useTrackRecentMenu();
  const Icon = resolveSidebarIcon(item.icon, item.slug);
  const isFavorite = favorites?.has(item.slug);
  const isActive = item.path
    ? pathname === item.path || pathname.startsWith(`${item.path}/`)
    : false;

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive, pathname]);

  useEffect(() => {
    if (!hasChildren || !globalExpand) return;
    if (globalExpand === "expand") setOpen(true);
    if (globalExpand === "collapse") setOpen(false);
  }, [globalExpand, hasChildren]);

  const handleNavigate = useCallback(() => {
    if (item.path) {
      trackRecent.mutate({ path: item.path, name: item.name, slug: item.slug });
    }
    onNavigate?.();
  }, [item.path, item.name, item.slug, onNavigate, trackRecent]);

  // Collapsible group (ERP module / submenu with children)
  if (hasChildren) {
    return (
      <div className={cn(depth > 0 && !collapsed && "ml-0.5")}>
        <button
          type="button"
          onClick={() => !collapsed && setOpen((v) => !v)}
          title={collapsed ? item.name : undefined}
          aria-expanded={open}
          className={cn(
            "flex w-full items-center rounded-lg text-left transition-colors",
            collapsed ? "justify-center px-2 py-2.5" : "gap-2 px-3 py-2",
            depth === 0
              ? "text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              : "text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
            childActive && depth === 0 && "text-indigo-700 dark:text-indigo-300"
          )}
        >
          <Icon
            size={collapsed ? 20 : depth === 0 ? 18 : 16}
            className={cn("shrink-0", childActive && "text-indigo-600 dark:text-indigo-400")}
          />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.name}</span>
              {open ? (
                <ChevronDown size={14} className="shrink-0 text-slate-400" />
              ) : (
                <ChevronRight size={14} className="shrink-0 text-slate-400" />
              )}
            </>
          )}
        </button>

        <AnimatePresence initial={false}>
          {open && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "mt-0.5 flex flex-col gap-0.5",
                  depth === 0 && "border-l border-slate-200 pl-2 dark:border-slate-700"
                )}
              >
                {item.children.map((child) => (
                  <SidebarMenuItem
                    key={child.id}
                    item={child}
                    depth={depth + 1}
                    collapsed={collapsed}
                    favorites={favorites}
                    globalExpand={globalExpand}
                    onToggleFavorite={onToggleFavorite}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!item.path) return null;

  // Leaf link
  return (
    <div className="group relative">
      <Link
        href={item.path}
        onClick={handleNavigate}
        title={collapsed ? item.name : undefined}
        className={cn(
          "flex items-center rounded-lg text-sm transition-colors",
          collapsed ? "justify-center px-2 py-2.5" : "gap-2 px-3 py-2",
          isActive
            ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
          item.status === "pending" && "opacity-60"
        )}
        style={!collapsed && depth > 0 ? { paddingLeft: `${Math.min(depth * 6 + 12, 24)}px` } : undefined}
      >
        <Icon size={collapsed ? 20 : 16} className="shrink-0 opacity-80" />
        {!collapsed && (
          <>
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span className="ml-auto rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
      {!collapsed && onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(item.slug);
          }}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100",
            isFavorite && "opacity-100 text-amber-500"
          )}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star size={12} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
});
