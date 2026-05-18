"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronRight, LogOut, Loader2 } from "lucide-react";
import { secureSignOut } from "@/lib/auth/client";
import { ACCOUNT_NAV, type NavItem } from "@/config/navigation";
import { filterNavigation } from "@/lib/navigation/filter-nav";
import { usePermissions } from "@/hooks/tenant/use-permissions";

function NavLink({
  item,
  depth = 0,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  depth?: number;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const hasChildren = !!item.children?.length;
  const isActive = item.href ? pathname.startsWith(item.href) : false;
  const Icon = item.icon;

  if (hasChildren && !item.href) {
    return (
      <div className={depth > 0 && !collapsed ? "ml-2" : ""}>
        <button
          type="button"
          onClick={() => !collapsed && setOpen(!open)}
          title={collapsed ? item.label : undefined}
          className={`flex w-full items-center rounded-lg text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 ${
            collapsed ? "justify-center px-2 py-2.5" : "gap-2 px-3 py-2"
          }`}
        >
          {Icon && <Icon size={collapsed ? 20 : 16} className="shrink-0" />}
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="mt-1 flex flex-col gap-0.5 border-l border-slate-200 pl-2 dark:border-slate-800">
            {item.children!.map((child) => (
              <NavLink key={child.id} item={child} depth={depth + 1} collapsed={collapsed} onNavigate={onNavigate} />
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
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={`flex items-center rounded-lg text-sm transition-colors ${
        collapsed ? "justify-center px-2 py-2.5" : "gap-2 px-3 py-2"
      } ${
        isActive
          ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}
      style={!collapsed && depth > 0 ? { paddingLeft: `${depth * 8 + 12}px` } : undefined}
    >
      {Icon && <Icon size={collapsed ? 20 : 18} className="shrink-0" />}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function SidebarSignOut({ collapsed }: { collapsed: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await secureSignOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      title={collapsed ? "Sign out" : undefined}
      className={`mt-1 flex w-full items-center rounded-lg text-sm text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/30 ${
        collapsed ? "justify-center px-2 py-2.5" : "gap-2 px-3 py-2"
      }`}
    >
      {loading ? <Loader2 size={18} className="shrink-0 animate-spin" /> : <LogOut size={18} className="shrink-0" />}
      {!collapsed && <span>Sign out</span>}
    </button>
  );
}

export function AppSidebar({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { data: session } = useSession();
  const { canAccessNavId, isLoading: permsLoading } = usePermissions();
  const navigation = useMemo(() => {
    const modules = session?.user?.enabledModules ?? [];
    if (permsLoading) return filterNavigation(modules.length ? modules : []);
    return filterNavigation(modules.length ? modules : [], canAccessNavId);
  }, [session?.user?.enabledModules, canAccessNavId, permsLoading]);

  return (
    <nav className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-4">
        <div className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavLink key={item.id} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t border-slate-200 px-2 py-3 dark:border-slate-800">
        <NavLink item={ACCOUNT_NAV} collapsed={collapsed} onNavigate={onNavigate} />
        <SidebarSignOut collapsed={collapsed} />
      </div>
    </nav>
  );
}
