export type SidebarMenuRecord = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  path: string | null;
  icon: string | null;
  moduleKey: string | null;
  menuType: "section" | "group" | "item";
  permissionModule: string | null;
  permissionFeature: string | null;
  permissionAction: string;
  sortOrder: number;
  isVisible: boolean;
  isActive: boolean;
  requiredPlan: string | null;
  requiredBusinessTypes: string[];
  hiddenForBusinessTypes: string[];
  requiredSubmodules: string[];
  featureFlagKey: string | null;
  badge: string | null;
  status: string;
};

export type RenderedSidebarMenu = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  path: string | null;
  badge: string | null;
  status: string;
  children: RenderedSidebarMenu[];
};

export type RenderedSidebarSection = {
  title: string;
  slug: string;
  icon: string | null;
  menus: RenderedSidebarMenu[];
};

export type SidebarResponse = {
  sections: RenderedSidebarSection[];
  favorites: string[];
  recent: { path: string; name: string; slug: string }[];
  meta: {
    templateId: string | null;
    templateSlug: string | null;
    planSlug: string | null;
    businessType: string | null;
    enabledModules: string[];
    source: "database" | "fallback";
  };
};

export type SidebarRenderContext = {
  tenantId: string;
  userId: string;
  role: string;
  businessType: string | null;
  businessTypeSlug: string | null;
  planSlug: string | null;
  enabledModules: string[];
  enabledSubmodules: string[];
  permissions: string[];
  featureFlags: Set<string>;
  hiddenMenuSlugs: Set<string>;
  isAdmin: boolean;
};
