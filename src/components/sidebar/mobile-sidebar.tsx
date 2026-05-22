"use client";

import { SidebarLayout } from "@/components/sidebar/sidebar-layout";

export function MobileSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return <SidebarLayout collapsed={false} onNavigate={onNavigate} />;
}
