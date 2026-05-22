"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import type { RenderedSidebarMenu, RenderedSidebarSection } from "@/lib/sidebar/types";

function flattenWithPath(sections: RenderedSidebarSection[]) {
  const items: { name: string; path: string; slug: string }[] = [];
  const walk = (menus: RenderedSidebarMenu[]) => {
    for (const m of menus) {
      if (m.path) items.push({ name: m.name, path: m.path, slug: m.slug });
      if (m.children.length) walk(m.children);
    }
  };
  for (const s of sections) walk(s.menus);
  return items;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data } = useSidebar();

  const allItems = useMemo(() => flattenWithPath(data?.sections ?? []), [data?.sections]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 12);
    const q = query.toLowerCase();
    return allItems.filter(
      (i) => i.name.toLowerCase().includes(q) || i.path.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [allItems, query]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router]
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/50 p-4 pt-[15vh] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Command palette"
            >
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
                <Search size={18} className="text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search menus, pages, actions..."
                  className="h-12 flex-1 bg-transparent text-sm outline-none dark:text-white"
                />
                <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <ul className="max-h-80 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <li className="px-3 py-6 text-center text-sm text-slate-500">No matching menus</li>
                ) : (
                  filtered.map((item) => (
                    <li key={item.path}>
                      <button
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</span>
                        <span className="text-xs text-slate-500">{item.path}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function useCommandPalette() {
  return { openPalette: () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true })) };
}
