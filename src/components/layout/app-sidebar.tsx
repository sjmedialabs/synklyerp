"use client";

import { SidebarLayout } from "@/components/sidebar/sidebar-layout";

/** @deprecated Use SidebarLayout directly. Kept for backward compatibility. */
export function AppSidebar(props: { collapsed: boolean; onNavigate?: () => void }) {
  return <SidebarLayout collapsed={props.collapsed} onNavigate={props.onNavigate} />;
}
