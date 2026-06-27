"use client";

import { useEffect } from "react";
import { useSidebarStore } from "@/stores/sidebar-store";

/** Marks sidebar store as hydrated on the client (avoids flash of wrong width). */
export function SidebarHydration({ children }: { children: React.ReactNode }) {
  const setHydrated = useSidebarStore((s) => s.setHydrated);

  useEffect(() => {
    setHydrated(true);
    try {
      localStorage.removeItem("synkly-sidebar");
    } catch {
      /* ignore */
    }
  }, [setHydrated]);

  return <>{children}</>;
}
