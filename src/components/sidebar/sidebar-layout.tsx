"use client";

import { useMemo, useState } from "react";
import { Loader2, LogOut, Search } from "lucide-react";
import { secureSignOut } from "@/lib/auth/client";
import { SidebarSection } from "@/components/sidebar/sidebar-section";
import { SidebarFavorites } from "@/components/sidebar/sidebar-favorites";
import { SidebarRecent } from "@/components/sidebar/sidebar-recent";
import { useSidebar, useToggleFavorite } from "@/hooks/useSidebar";
import type { RenderedSidebarMenu, RenderedSidebarSection } from "@/lib/sidebar/types";

type SidebarLayoutProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

function flattenMenus(sections: RenderedSidebarSection[]): RenderedSidebarMenu[] {
  const result: RenderedSidebarMenu[] = [];
  const walk = (items: RenderedSidebarMenu[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children.length) walk(item.children);
    }
  };
  for (const section of sections) walk(section.menus);
  return result;
}

export function SidebarLayout({ collapsed, onNavigate }: SidebarLayoutProps) {
  const { data, isLoading, isError } = useSidebar();
  const toggleFavorite = useToggleFavorite();
  const [query, setQuery] = useState("");
  const [signOutLoading, setSignOutLoading] = useState(false);

  const favorites = useMemo(() => new Set(data?.favorites ?? []), [data?.favorites]);

  const filteredSections = useMemo(() => {
    if (!data?.sections) return [];
    if (!query.trim()) return data.sections;

    const q = query.toLowerCase();
    const allMenus = flattenMenus(data.sections);
    const matchingSlugs = new Set(
      allMenus.filter((m) => m.name.toLowerCase().includes(q) || m.path?.toLowerCase().includes(q)).map((m) => m.slug)
    );

    const filterTree = (menus: RenderedSidebarMenu[]): RenderedSidebarMenu[] =>
      menus
        .map((m) => ({
          ...m,
          children: filterTree(m.children),
        }))
        .filter((m) => matchingSlugs.has(m.slug) || m.children.length > 0);

    return data.sections
      .map((s) => ({ ...s, menus: filterTree(s.menus) }))
      .filter((s) => s.menus.length > 0);
  }, [data?.sections, query]);

  const handleToggleFavorite = (slug: string) => {
    toggleFavorite.mutate({ menuSlug: slug, favorite: !favorites.has(slug) });
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await secureSignOut();
    } finally {
      setSignOutLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 text-xs text-red-500">
        Could not load navigation. Refresh the page.
      </div>
    );
  }

  return (
    <nav className="flex h-full min-h-0 flex-col overflow-hidden" aria-label="Main navigation">
      {!collapsed && (
        <div className="shrink-0 px-2 pb-2 pt-1">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menus..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-2">
        {!query && !collapsed && (
          <>
            <SidebarFavorites
              sections={data.sections}
              favorites={favorites}
              onNavigate={onNavigate}
            />
            <SidebarRecent recent={data.recent} onNavigate={onNavigate} />
          </>
        )}

        <div className="flex flex-col gap-1">
          {filteredSections.map((section) => (
            <SidebarSection
              key={section.slug}
              section={section}
              collapsed={collapsed}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 px-2 py-3 dark:border-slate-800">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signOutLoading}
          title={collapsed ? "Sign out" : undefined}
          className={`mt-1 flex w-full items-center rounded-lg text-sm text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/30 ${
            collapsed ? "justify-center px-2 py-2.5" : "gap-2 px-3 py-2"
          }`}
        >
          {signOutLoading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </nav>
  );
}
