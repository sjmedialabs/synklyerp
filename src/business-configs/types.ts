import type { ErpModuleKey, ErpSubmoduleKey } from "@/constants/onboarding";

export type BusinessConfigSlug = "product" | "service" | "hybrid";

export type BusinessModuleConfig = {
  code: string;
  erpModule: ErpModuleKey;
  label: string;
};

export type BusinessSubmoduleConfig = {
  code: ErpSubmoduleKey;
  erpModule: ErpModuleKey;
  label: string;
};

export type DashboardWidgetConfig = {
  widgetCode: string;
  order: number;
  column: number;
  span: number;
  visible: boolean;
};

export type WorkflowTemplateConfig = {
  workflowCode: string;
  name: string;
  steps: string[];
};

export type RoleTemplateConfig = {
  templateCode: string;
  name: string;
  description: string;
  suggestedPermissions: string[];
};

export type NavigationConfig = {
  navId: string;
  moduleKey: ErpModuleKey;
  label: string;
};

export type ReportConfig = {
  reportCode: string;
  name: string;
  moduleKey: ErpModuleKey;
};

export type BranchDefaultConfig = {
  branchType: string;
  enabledModules: ErpModuleKey[];
  notes: string;
};

export type BusinessTypeConfig = {
  slug: BusinessConfigSlug;
  legacyKey: "Product" | "Service" | "Hybrid";
  modules: BusinessModuleConfig[];
  submodules: BusinessSubmoduleConfig[];
  dashboards: DashboardWidgetConfig[];
  workflows: WorkflowTemplateConfig[];
  permissions: string[];
  reports: ReportConfig[];
  navigation: NavigationConfig[];
  branchDefaults: BranchDefaultConfig[];
  roleTemplates: RoleTemplateConfig[];
};

export type SubcategoryConfigOverride = {
  subcategorySlug: string;
  modules?: ErpModuleKey[];
  submodules?: ErpSubmoduleKey[];
  dashboards?: DashboardWidgetConfig[];
  workflows?: WorkflowTemplateConfig[];
  roleTemplates?: RoleTemplateConfig[];
};

export type ResolvedBusinessConfig = BusinessTypeConfig & {
  erpModules: ErpModuleKey[];
  erpSubmodules: ErpSubmoduleKey[];
  enabledModuleRows: { moduleCode: string; submoduleCode: string | null }[];
};
