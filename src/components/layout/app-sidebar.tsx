"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ACCOUNT_NAV, type NavItem } from "@/config/navigation";
import { filterNavigation } from "@/lib/navigation/filter-nav";
import { usePermissions } from "@/hooks/tenant/use-permissions";

function NavLink({ item, depth = 0, collapsed }: { item: NavItem; depth?: number; collapsed?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const hasChildren = !!item.children?.length;
  const isActive = item.href ? pathname.startsWith(item.href) : false;
  const Icon = item.icon;

  if (hasChildren && !item.href) {
    return (
      <div className={depth > 0 ? "ml-2" : ""}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {Icon && <Icon size={16} />}
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="mt-1 flex flex-col gap-0.5 border-l border-slate-200 pl-2 dark:border-slate-800">
            {item.children!.map((child) => (
              <NavLink key={child.id} item={child} depth={depth + 1} collapsed={collapsed} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}
      style={{ paddingLeft: depth > 0 ? `${depth * 8 + 12}px` : undefined }}
    >
      {Icon && <Icon size={18} />}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession();
  const { canAccessNavId, isLoading: permsLoading } = usePermissions();
  const navigation = useMemo(() => {
    const modules = session?.user?.enabledModules ?? [];
    if (permsLoading) return filterNavigation(modules.length ? modules : []);
    return filterNavigation(modules.length ? modules : [], canAccessNavId);
  }, [session?.user?.enabledModules, canAccessNavId, permsLoading]);

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-4 px-2">
      {navigation.map((item) => (
        <NavLink key={item.id} item={item} collapsed={collapsed} />
      ))}
      <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
        <NavLink item={ACCOUNT_NAV} collapsed={collapsed} />
      </div>
    </nav>
  );
}
