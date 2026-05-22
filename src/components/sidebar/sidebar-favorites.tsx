"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { resolveSidebarIcon } from "@/lib/sidebar/icon-map";
import type { RenderedSidebarSection } from "@/lib/sidebar/types";

type SidebarFavoritesProps = {
  sections: RenderedSidebarSection[];
  favorites: Set<string>;
  onNavigate?: () => void;
};

function findMenuBySlug(sections: RenderedSidebarSection[], slug: string) {
  for (const section of sections) {
    const stack = [...section.menus];
    while (stack.length) {
      const item = stack.pop()!;
      if (item.slug === slug && item.path) return item;
      stack.push(...item.children);
    }
  }
  return null;
}

export function SidebarFavorites({ sections, favorites, onNavigate }: SidebarFavoritesProps) {
  if (favorites.size === 0) return null;

  const items = [...favorites]
    .map((slug) => findMenuBySlug(sections, slug))
    .filter(Boolean);

  if (!items.length) return null;

  return (
    <div className="mb-3">
      <p className="mb-1 flex items-center gap-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <Star size={10} className="text-amber-500" /> Favorites
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = resolveSidebarIcon(item!.icon, item!.slug);
          return (
            <Link
              key={item!.slug}
              href={item!.path!}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Icon size={16} />
              <span className="truncate">{item!.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
