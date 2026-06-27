"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_NAV = [
  {
    section: "Platform",
    items: [
      { href: "/superadmin", label: "Tenants", icon: Users },
      { href: "/superadmin/plans", label: "Plans", icon: Shield },
      { href: "/superadmin/cms", label: "CMS", icon: FileText },
    ],
  },
  {
    section: "Platform Administration",
    items: [
      { href: "/superadmin/business-types", label: "Business Categories", icon: Building2 },
      { href: "/superadmin/features", label: "ERP Features (Menus)", icon: LayoutGrid },
      { href: "/superadmin/feature-assignment", label: "Assign to Categories", icon: Link2 },
      { href: "/superadmin/sidebar-templates", label: "Sidebar Templates", icon: LayoutTemplate },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/superadmin") return pathname === "/superadmin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <Link href="/superadmin" className="text-lg font-bold text-slate-900">
          Synkly Platform
        </Link>
        <p className="mt-1 text-xs text-slate-500">Super Admin Console</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {PLATFORM_NAV.map((group) => (
          <div key={group.section} className="mb-6">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-indigo-50 font-medium text-indigo-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
