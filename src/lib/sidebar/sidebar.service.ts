import { APP_NAVIGATION, ACCOUNT_NAV, type NavItem } from "@/config/navigation";
import { filterNavigation } from "@/lib/navigation/filter-nav";
import {
  buildSidebarSections,
  filterMenusByTemplate,
} from "@/lib/sidebar/menu-renderer.service";
import type { SidebarResponse, SidebarRenderContext } from "@/lib/sidebar/types";
import { listAllSidebarMenus, countSidebarMenus } from "@/repositories/sidebar/sidebar-menus";
import {
  getTenantSidebarConfig,
  resolveTenantSidebarTemplate,
} from "@/repositories/sidebar/sidebar-templates";
import { getUserMenuPreferences } from "@/repositories/sidebar/user-menu-preferences";
import { listTenantEnabledSubmoduleCodes } from "@/repositories/provisioning/tenant-enabled-modules";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { listUserPermissions } from "@/lib/rbac/permissions";
import { iconKeyForNavItem } from "@/lib/sidebar/nav-item-icons";
import type { AppRole } from "@/types/auth";

export class SidebarService {
  async getSidebarForUser(input: {
    tenantId: string;
    userId: string;
    role: AppRole;
    enabledModules: string[];
    businessType?: string | null;
  }): Promise<SidebarResponse> {
    const [menus, template, tenantConfig, prefs, planSlug, submodules, permissions, featureFlags] =
      await Promise.all([
        listAllSidebarMenus(),
        resolveTenantSidebarTemplate(input.tenantId),
        getTenantSidebarConfig(input.tenantId),
        getUserMenuPreferences(input.tenantId, input.userId),
        this.getTenantPlanSlug(input.tenantId),
        listTenantEnabledSubmoduleCodes(input.tenantId).catch(() => [] as string[]),
        listUserPermissions(input.userId, input.role, input.tenantId),
        this.getTenantFeatureFlags(input.tenantId),
      ]);

    if (!menus.length) {
      return this.buildFallbackSidebar(input);
    }

    const filteredMenus = template?.menuIds.length
      ? filterMenusByTemplate(menus, template.menuIds)
      : menus;

    const ctx: SidebarRenderContext = {
      tenantId: input.tenantId,
      userId: input.userId,
      role: input.role,
      businessType: input.businessType ?? null,
      businessTypeSlug: input.businessType ?? null,
      planSlug,
      enabledModules: input.enabledModules,
      enabledSubmodules: submodules,
      permissions,
      featureFlags,
      hiddenMenuSlugs: new Set(tenantConfig?.hidden_menu_slugs ?? []),
      isAdmin: input.role === "ADMIN" || input.role === "SUPERADMIN",
    };

    const sections = buildSidebarSections(filteredMenus, ctx);

    return {
      sections,
      favorites: prefs.favoriteMenuSlugs,
      recent: prefs.recentPaths,
      meta: {
        templateId: template?.id ?? null,
        templateSlug: template?.slug ?? null,
        planSlug,
        businessType: input.businessType ?? null,
        enabledModules: input.enabledModules,
        source: "database",
      },
    };
  }

  private async getTenantPlanSlug(tenantId: string): Promise<string | null> {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("tenants")
        .select("plan, plan_id, plans:plan_id(slug)")
        .eq("id", tenantId)
        .maybeSingle();

      if (!data) return null;
      const joined = (data as { plans?: { slug: string } | { slug: string }[] | null }).plans;
      const planRow = Array.isArray(joined) ? joined[0] : joined;
      return planRow?.slug ?? (data as { plan?: string }).plan ?? null;
    } catch {
      return null;
    }
  }

  private async getTenantFeatureFlags(tenantId: string): Promise<Set<string>> {
    try {
      const supabase = createAdminClient();
      const { data: tenant } = await supabase
        .from("tenants")
        .select("plan_id")
        .eq("id", tenantId)
        .maybeSingle();

      const planId = (tenant as { plan_id?: string } | null)?.plan_id;
      if (!planId) return new Set();

      const { data, error } = await supabase
        .from("plan_feature_flags")
        .select("enabled, feature_flags:feature_flag_id(key)")
        .eq("plan_id", planId)
        .eq("enabled", true);

      if (error) {
        if (isMissingSchemaError(error)) return new Set();
        return new Set();
      }

      const keys = new Set<string>();
      for (const row of data ?? []) {
        const flag = (row as { feature_flags: { key: string } | { key: string }[] | null }).feature_flags;
        const key = Array.isArray(flag) ? flag[0]?.key : flag?.key;
        if (key) keys.add(key);
      }
      return keys;
    } catch {
      return new Set();
    }
  }

  private buildFallbackSidebar(input: {
    tenantId: string;
    userId: string;
    role: AppRole;
    enabledModules: string[];
    businessType?: string | null;
  }): SidebarResponse {
    const nav = filterNavigation(input.enabledModules.length ? input.enabledModules : []);
    const withAccount = [...nav, ACCOUNT_NAV];

    const sections = withAccount.map((item) => navItemToSection(item));

    return {
      sections,
      favorites: [],
      recent: [],
      meta: {
        templateId: null,
        templateSlug: null,
        planSlug: null,
        businessType: input.businessType ?? null,
        enabledModules: input.enabledModules,
        source: "fallback",
      },
    };
  }

  async isDatabaseReady(): Promise<boolean> {
    const count = await countSidebarMenus();
    return count > 0;
  }
}

function navItemToSection(item: NavItem): SidebarResponse["sections"][number] {
  const children = (item.children ?? []).map(navItemToMenu);
  return {
    title: item.label,
    slug: item.id,
    icon: iconKeyForNavItem(item.id),
    menus: [
      {
        id: item.id,
        slug: item.id,
        name: item.label,
        icon: iconKeyForNavItem(item.id),
        path: item.href ?? null,
        badge: item.badge ?? null,
        status: item.status ?? "built",
        children,
      },
    ],
  };
}

function navItemToMenu(item: NavItem): SidebarResponse["sections"][number]["menus"][number] {
  return {
    id: item.id,
    slug: item.id,
    name: item.label,
    icon: iconKeyForNavItem(item.id),
    path: item.href ?? null,
    badge: item.badge ?? null,
    status: item.status ?? "built",
    children: (item.children ?? []).map(navItemToMenu),
  };
}

export const sidebarService = new SidebarService();
