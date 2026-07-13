export type AccountGroup = {
  id: string;
  tenantId: string;
  parentId: string | null;
  parentCode: string | null;
  parentName: string | null;
  code: string;
  name: string;
  description: string | null;
  groupType: string;
  status: string;
  allowManualMapping: boolean;
  budgetApplicable: boolean;
  showInReports: boolean;
  costCenterApplicable: boolean;
  profitCenterApplicable: boolean;
  level: number;
  accountCount: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinancialDimension = {
  id: string;
  tenantId: string;
  dimensionCode: string;
  dimensionName: string;
  description: string | null;
  dataType: string;
  allowMultipleValues: boolean;
  isActive: boolean;
  valueCount: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DimensionValue = {
  id: string;
  tenantId: string;
  dimensionId: string;
  valueCode: string;
  valueName: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CostCenter = {
  id: string;
  tenantId: string;
  parentId: string | null;
  parentCode: string | null;
  parentName: string | null;
  costCenterCode: string;
  costCenterName: string;
  costCenterType: string;
  managerName: string | null;
  location: string | null;
  description: string | null;
  status: string;
  budgetAmount: number;
  currency: string;
  allowManualEntry: boolean;
  includeInBudget: boolean;
  allowTransactions: boolean;
  isBillable: boolean;
  level: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChartOfAccount = {
  id: string;
  tenantId: string;
  parentId: string | null;
  accountCode: string;
  accountName: string;
  description: string | null;
  accountGroupId: string | null;
  accountGroupName: string | null;
  accountType: string;
  accountCategory: string | null;
  currency: string;
  allowManualEntry: boolean;
  isActive: boolean;
  costCenterApplicable: boolean;
  budgetControl: boolean;
  balanceSheetClassification: string | null;
  profitLossClassification: string | null;
  taxCategory: string | null;
  vatGstApplicable: string;
  level: number;
  sortOrder: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
  childCount: number;
};

type AccountGroupRow = {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  description: string | null;
  group_type: string;
  status: string;
  allow_manual_mapping: boolean;
  budget_applicable: boolean;
  show_in_reports: boolean;
  cost_center_applicable: boolean;
  profit_center_applicable: boolean;
  level: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  parent?: { code: string; name: string } | { code: string; name: string }[] | null;
  created_by_user?: { name: string } | { name: string }[] | null;
  updated_by_user?: { name: string } | { name: string }[] | null;
};

type DimensionRow = {
  id: string;
  tenant_id: string;
  dimension_code: string;
  dimension_name: string;
  description: string | null;
  data_type: string;
  allow_multiple_values: boolean;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  created_by_user?: { name: string } | { name: string }[] | null;
  updated_by_user?: { name: string } | { name: string }[] | null;
};

type CostCenterRow = {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  cost_center_code: string;
  cost_center_name: string;
  cost_center_type: string;
  manager_name: string | null;
  location: string | null;
  description: string | null;
  status: string;
  budget_amount: number;
  currency: string;
  allow_manual_entry: boolean;
  include_in_budget: boolean;
  allow_transactions: boolean;
  is_billable: boolean;
  level: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  parent?: { cost_center_code: string; cost_center_name: string } | { cost_center_code: string; cost_center_name: string }[] | null;
  created_by_user?: { name: string } | { name: string }[] | null;
  updated_by_user?: { name: string } | { name: string }[] | null;
};

type AccountGroupRowLegacy = AccountGroupRow;

type CoaRow = {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  account_code: string;
  account_name: string;
  description: string | null;
  account_group_id: string | null;
  account_type: string;
  account_category: string | null;
  currency: string;
  allow_manual_entry: boolean;
  is_active: boolean;
  cost_center_applicable: boolean;
  budget_control: boolean;
  balance_sheet_classification: string | null;
  profit_loss_classification: string | null;
  tax_category: string | null;
  vat_gst_applicable: string;
  level: number;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  account_groups?: { name: string } | { name: string }[] | null;
  created_by_user?: { name: string } | { name: string }[] | null;
  updated_by_user?: { name: string } | { name: string }[] | null;
};

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function mapAccountGroup(row: AccountGroupRowLegacy, accountCount = 0): AccountGroup {
  const parent = unwrapJoin(row.parent);
  const createdBy = unwrapJoin(row.created_by_user);
  const updatedBy = unwrapJoin(row.updated_by_user);
  return {
    id: row.id,
    tenantId: row.tenant_id,
    parentId: row.parent_id,
    parentCode: parent?.code ?? null,
    parentName: parent?.name ?? null,
    code: row.code,
    name: row.name,
    description: row.description,
    groupType: row.group_type ?? "Group",
    status: row.status,
    allowManualMapping: row.allow_manual_mapping ?? true,
    budgetApplicable: row.budget_applicable ?? false,
    showInReports: row.show_in_reports ?? true,
    costCenterApplicable: row.cost_center_applicable ?? false,
    profitCenterApplicable: row.profit_center_applicable ?? false,
    level: Number(row.level ?? 0),
    accountCount,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdByName: createdBy?.name ?? null,
    updatedByName: updatedBy?.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFinancialDimension(row: DimensionRow, valueCount = 0): FinancialDimension {
  const createdBy = unwrapJoin(row.created_by_user);
  const updatedBy = unwrapJoin(row.updated_by_user);
  return {
    id: row.id,
    tenantId: row.tenant_id,
    dimensionCode: row.dimension_code,
    dimensionName: row.dimension_name,
    description: row.description,
    dataType: row.data_type,
    allowMultipleValues: row.allow_multiple_values,
    isActive: row.is_active,
    valueCount,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdByName: createdBy?.name ?? null,
    updatedByName: updatedBy?.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDimensionValue(row: {
  id: string;
  tenant_id: string;
  dimension_id: string;
  value_code: string;
  value_name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}): DimensionValue {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    dimensionId: row.dimension_id,
    valueCode: row.value_code,
    valueName: row.value_name,
    description: row.description,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCostCenter(row: CostCenterRow): CostCenter {
  const parent = unwrapJoin(row.parent);
  const createdBy = unwrapJoin(row.created_by_user);
  const updatedBy = unwrapJoin(row.updated_by_user);
  return {
    id: row.id,
    tenantId: row.tenant_id,
    parentId: row.parent_id,
    parentCode: parent?.cost_center_code ?? null,
    parentName: parent?.cost_center_name ?? null,
    costCenterCode: row.cost_center_code,
    costCenterName: row.cost_center_name,
    costCenterType: row.cost_center_type,
    managerName: row.manager_name,
    location: row.location,
    description: row.description,
    status: row.status,
    budgetAmount: Number(row.budget_amount ?? 0),
    currency: row.currency,
    allowManualEntry: row.allow_manual_entry,
    includeInBudget: row.include_in_budget,
    allowTransactions: row.allow_transactions,
    isBillable: row.is_billable,
    level: Number(row.level ?? 0),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdByName: createdBy?.name ?? null,
    updatedByName: updatedBy?.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapChartOfAccount(row: CoaRow, childCount = 0): ChartOfAccount {
  const group = unwrapJoin(row.account_groups);
  const createdBy = unwrapJoin(row.created_by_user);
  const updatedBy = unwrapJoin(row.updated_by_user);

  return {
    id: row.id,
    tenantId: row.tenant_id,
    parentId: row.parent_id,
    accountCode: row.account_code,
    accountName: row.account_name,
    description: row.description,
    accountGroupId: row.account_group_id,
    accountGroupName: group?.name ?? null,
    accountType: row.account_type,
    accountCategory: row.account_category,
    currency: row.currency,
    allowManualEntry: row.allow_manual_entry,
    isActive: row.is_active,
    costCenterApplicable: row.cost_center_applicable,
    budgetControl: row.budget_control,
    balanceSheetClassification: row.balance_sheet_classification,
    profitLossClassification: row.profit_loss_classification,
    taxCategory: row.tax_category,
    vatGstApplicable: row.vat_gst_applicable,
    level: row.level,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdByName: createdBy?.name ?? null,
    updatedByName: updatedBy?.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    childCount,
  };
}

export function accountGroupToDb(data: {
  tenantId: string;
  parentId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  groupType: string;
  status: string;
  allowManualMapping: boolean;
  budgetApplicable: boolean;
  showInReports: boolean;
  costCenterApplicable: boolean;
  profitCenterApplicable: boolean;
  level?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
}) {
  return {
    tenant_id: data.tenantId,
    parent_id: data.parentId ?? null,
    code: data.code,
    name: data.name,
    description: data.description ?? null,
    group_type: data.groupType,
    status: data.status,
    allow_manual_mapping: data.allowManualMapping,
    budget_applicable: data.budgetApplicable,
    show_in_reports: data.showInReports,
    cost_center_applicable: data.costCenterApplicable,
    profit_center_applicable: data.profitCenterApplicable,
    level: data.level ?? 0,
    created_by: data.createdBy ?? null,
    updated_by: data.updatedBy ?? null,
  };
}

export function chartOfAccountToDb(data: {
  tenantId: string;
  parentId?: string | null;
  accountCode: string;
  accountName: string;
  description?: string | null;
  accountGroupId?: string | null;
  accountType: string;
  accountCategory?: string | null;
  currency: string;
  allowManualEntry: boolean;
  isActive: boolean;
  costCenterApplicable: boolean;
  budgetControl: boolean;
  balanceSheetClassification?: string | null;
  profitLossClassification?: string | null;
  taxCategory?: string | null;
  vatGstApplicable: string;
  level?: number;
  sortOrder?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
}) {
  return {
    tenant_id: data.tenantId,
    parent_id: data.parentId ?? null,
    account_code: data.accountCode,
    account_name: data.accountName,
    description: data.description ?? null,
    account_group_id: data.accountGroupId ?? null,
    account_type: data.accountType,
    account_category: data.accountCategory ?? null,
    currency: data.currency,
    allow_manual_entry: data.allowManualEntry,
    is_active: data.isActive,
    cost_center_applicable: data.costCenterApplicable,
    budget_control: data.budgetControl,
    balance_sheet_classification: data.balanceSheetClassification ?? null,
    profit_loss_classification: data.profitLossClassification ?? null,
    tax_category: data.taxCategory ?? null,
    created_by: data.createdBy ?? null,
    updated_by: data.updatedBy ?? null,
  };
}

export function financialDimensionToDb(data: {
  tenantId: string;
  dimensionCode: string;
  dimensionName: string;
  description?: string | null;
  dataType: string;
  allowMultipleValues: boolean;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
}) {
  return {
    tenant_id: data.tenantId,
    dimension_code: data.dimensionCode,
    dimension_name: data.dimensionName,
    description: data.description ?? null,
    data_type: data.dataType,
    allow_multiple_values: data.allowMultipleValues,
    is_active: data.isActive,
    created_by: data.createdBy ?? null,
    updated_by: data.updatedBy ?? null,
  };
}

export function dimensionValueToDb(data: {
  tenantId: string;
  dimensionId: string;
  valueCode: string;
  valueName: string;
  description?: string | null;
  isActive: boolean;
  sortOrder?: number;
}) {
  return {
    tenant_id: data.tenantId,
    dimension_id: data.dimensionId,
    value_code: data.valueCode,
    value_name: data.valueName,
    description: data.description ?? null,
    is_active: data.isActive,
    sort_order: data.sortOrder ?? 0,
  };
}

export function costCenterToDb(data: {
  tenantId: string;
  parentId?: string | null;
  costCenterCode: string;
  costCenterName: string;
  costCenterType: string;
  managerName?: string | null;
  location?: string | null;
  description?: string | null;
  status: string;
  budgetAmount: number;
  currency: string;
  allowManualEntry: boolean;
  includeInBudget: boolean;
  allowTransactions: boolean;
  isBillable: boolean;
  level?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
}) {
  return {
    tenant_id: data.tenantId,
    parent_id: data.parentId ?? null,
    cost_center_code: data.costCenterCode,
    cost_center_name: data.costCenterName,
    cost_center_type: data.costCenterType,
    manager_name: data.managerName ?? null,
    location: data.location ?? null,
    description: data.description ?? null,
    status: data.status,
    budget_amount: data.budgetAmount,
    currency: data.currency,
    allow_manual_entry: data.allowManualEntry,
    include_in_budget: data.includeInBudget,
    allow_transactions: data.allowTransactions,
    is_billable: data.isBillable,
    level: data.level ?? 0,
    created_by: data.createdBy ?? null,
    updated_by: data.updatedBy ?? null,
  };
}
