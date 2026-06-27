import { SIDEBAR_MENU_CATALOG, type MenuSeedNode } from "@/lib/sidebar/menu-seed-data";

export type ModuleScopeItemDef = {
  key: string;
  title: string;
  description?: string;
  status?: "planned" | "in_progress" | "available";
};

export type ModulePageDefinition = {
  path: string;
  title: string;
  description: string;
  moduleKey: string | null;
  menuStatus: "built" | "scope" | "pending";
  scopeItems: ModuleScopeItemDef[];
};

function defaultScopeItems(title: string): ModuleScopeItemDef[] {
  return [
    { key: "overview", title: `${title} overview`, description: "Summary workspace for this module area." },
    { key: "records", title: "Records & tracking", description: "Structured records managed per tenant." },
    { key: "workflows", title: "Workflows & approvals", description: "Configurable approval and automation flows." },
    { key: "reports", title: "Reports & exports", description: "Operational and management reporting." },
  ];
}

function walk(nodes: MenuSeedNode[], moduleKey: string | null, acc: Map<string, ModulePageDefinition>) {
  for (const node of nodes) {
    const nextModule = node.moduleKey ?? moduleKey;
    if (node.path?.startsWith("/app")) {
      acc.set(node.path, {
        path: node.path,
        title: node.name,
        description: `${node.name} workspace for your organisation.`,
        moduleKey: nextModule,
        menuStatus: node.status ?? "pending",
        scopeItems: defaultScopeItems(node.name),
      });
    }
    if (node.children?.length) walk(node.children, nextModule, acc);
  }
}

const REGISTRY = (() => {
  const map = new Map<string, ModulePageDefinition>();
  walk(SIDEBAR_MENU_CATALOG, null, map);
  return map;
})();

export function getModulePageDefinition(pagePath: string): ModulePageDefinition | null {
  return REGISTRY.get(pagePath) ?? null;
}

export function listAllModulePageDefinitions(): ModulePageDefinition[] {
  return [...REGISTRY.values()].sort((a, b) => a.path.localeCompare(b.path));
}
