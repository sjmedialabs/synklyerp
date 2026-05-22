"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/superadmin", label: "Tenants" },
  { href: "/superadmin/business-types", label: "Business Types" },
  { href: "/superadmin/business-categories", label: "Categories" },
  { href: "/superadmin/plans", label: "Plans" },
  { href: "/superadmin/cms", label: "CMS" },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/superadmin" className="text-lg font-bold">
              Synkly Super Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                      ? "text-white"
                      : "text-slate-400 hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/api/auth/signout"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
          >
            Sign out
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
