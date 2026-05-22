"use client";

import { memo } from "react";
import { SidebarMenuItem } from "@/components/sidebar/sidebar-menu-item";
import type { RenderedSidebarSection } from "@/lib/sidebar/types";

type SidebarSectionProps = {
  section: RenderedSidebarSection;
  collapsed?: boolean;
  favorites?: Set<string>;
  onToggleFavorite?: (slug: string) => void;
  onNavigate?: () => void;
};

export const SidebarSection = memo(function SidebarSection({
  section,
  collapsed,
  favorites,
  onToggleFavorite,
  onNavigate,
}: SidebarSectionProps) {
  if (!section.menus.length) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {section.menus.map((menu) => (
        <SidebarMenuItem
          key={menu.id}
          item={menu}
          collapsed={collapsed}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
});
