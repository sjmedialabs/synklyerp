"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarState = {
  desktopOpen: boolean;
  hydrated: boolean;
  setDesktopOpen: (open: boolean) => void;
  toggleDesktop: () => void;
  setHydrated: (value: boolean) => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      desktopOpen: false,
      hydrated: false,
      setDesktopOpen: (open) => set({ desktopOpen: open }),
      toggleDesktop: () => set({ desktopOpen: !get().desktopOpen }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "synkly-sidebar",
      partialize: (state) => ({ desktopOpen: state.desktopOpen }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
