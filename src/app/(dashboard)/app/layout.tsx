"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, ChevronDown, X } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NotificationCenter } from "@/components/layout/notification-center";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { Toaster } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const tenantName = session?.user?.tenantName ?? "Workspace";
  const businessType = session?.user?.businessType ?? "—";
  const userName = session?.user?.name ?? "User";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Toaster position="top-right" richColors />
      <aside
        className={`z-20 hidden flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 md:flex ${
          sidebarOpen ? "w-64" : "w-[72px]"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-indigo-600 font-bold text-white">
                S
              </div>
              <span className="truncate font-bold tracking-tight dark:text-white">SynklyERP</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>
        </div>
        <AppSidebar collapsed={!sidebarOpen} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <button type="button" className="text-slate-500 md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="hidden items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 sm:flex">
              <span>{tenantName}</span>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {businessType}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="relative hidden sm:block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search (Cmd+K)"
                className="h-9 w-64 rounded-full border-transparent bg-slate-100 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800 dark:focus:bg-slate-900"
              />
            </div>
            <NotificationCenter />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                {initials}
              </div>
              <div className="hidden flex-col items-start text-left sm:flex">
                <span className="text-sm font-medium leading-none text-slate-900 dark:text-white">{userName}</span>
                <span className="mt-1 text-xs leading-none text-slate-500">{session?.user?.role}</span>
              </div>
              <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto h-full max-w-7xl"
            >
              <AppBreadcrumbs />
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex h-full w-64 max-w-[85%] flex-col bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <span className="font-bold dark:text-white">SynklyERP</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="text-slate-500">
                <X size={20} />
              </button>
            </div>
            <AppSidebar collapsed={false} />
          </aside>
        </div>
      )}
    </div>
  );
}
