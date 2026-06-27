"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SuperAdminSidebar } from "@/components/superadmin/super-admin-sidebar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <SuperAdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
          <p className="truncate text-sm text-slate-500">{pathname}</p>
          <Link
            href="/api/auth/signout"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </Link>
        </header>
        <main className="flex-1 overflow-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
