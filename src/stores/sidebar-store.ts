"use client";

import { create } from "zustand";

type SidebarState = {
  desktopOpen: boolean;
  hydrated: boolean;
  setDesktopOpen: (open: boolean) => void;
  toggleDesktop: () => void;
  setHydrated: (value: boolean) => void;
};

export const useSidebarStore = create<SidebarState>((set, get) => ({
  desktopOpen: false,
  hydrated: true,
  setDesktopOpen: (open) => set({ desktopOpen: open }),
  toggleDesktop: () => set({ desktopOpen: !get().desktopOpen }),
  setHydrated: (value) => set({ hydrated: value }),
}));
