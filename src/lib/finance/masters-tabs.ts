export type FinanceMasterTab = {
  slug: string;
  label: string;
  path: string;
  statKey: keyof FinanceMasterStatKeys;
  primary?: boolean;
};

export type FinanceMasterStatKeys = {
  chartOfAccounts: number;
  accountGroups: number;
  financialDimensions: number;
  costCenters: number;
  profitCenters: number;
  banks: number;
  taxConfiguration: number;
  paymentTerms: number;
  currency: number;
  exchangeRates: number;
  financialYear: number;
  accountingPeriods: number;
  voucherTypes: number;
  numberSeries: number;
  budgetCategories: number;
  assetCategories: number;
};

export const FINANCE_MASTER_PRIMARY_TABS: FinanceMasterTab[] = [
  {
    slug: "chart-of-accounts",
    label: "Chart of Accounts",
    path: "/app/finance/masters/chart-of-accounts",
    statKey: "chartOfAccounts",
    primary: true,
  },
  {
    slug: "account-groups",
    label: "Account Groups",
    path: "/app/finance/masters/account-groups",
    statKey: "accountGroups",
    primary: true,
  },
  {
    slug: "financial-dimensions",
    label: "Financial Dimensions",
    path: "/app/finance/masters/financial-dimensions",
    statKey: "financialDimensions",
    primary: true,
  },
  {
    slug: "cost-centers",
    label: "Cost Centers",
    path: "/app/finance/masters/cost-centers",
    statKey: "costCenters",
    primary: true,
  },
  {
    slug: "profit-centers",
    label: "Profit Centers",
    path: "/app/finance/masters/profit-centers",
    statKey: "profitCenters",
    primary: true,
  },
  {
    slug: "banks",
    label: "Banks",
    path: "/app/finance/masters/banks",
    statKey: "banks",
    primary: true,
  },
  {
    slug: "tax-configuration",
    label: "Tax Configuration",
    path: "/app/finance/masters/tax-configuration",
    statKey: "taxConfiguration",
    primary: true,
  },
];

export const FINANCE_MASTER_MORE_TABS: FinanceMasterTab[] = [
  {
    slug: "payment-terms",
    label: "Payment Terms",
    path: "/app/finance/masters/payment-terms",
    statKey: "paymentTerms",
  },
  {
    slug: "currency",
    label: "Currency",
    path: "/app/finance/masters/currency",
    statKey: "currency",
  },
  {
    slug: "exchange-rates",
    label: "Exchange Rates",
    path: "/app/finance/masters/exchange-rates",
    statKey: "exchangeRates",
  },
  {
    slug: "financial-year",
    label: "Financial Year",
    path: "/app/finance/masters/financial-year",
    statKey: "financialYear",
  },
  {
    slug: "accounting-periods",
    label: "Accounting Periods",
    path: "/app/finance/masters/accounting-periods",
    statKey: "accountingPeriods",
  },
  {
    slug: "voucher-types",
    label: "Voucher Types",
    path: "/app/finance/masters/voucher-types",
    statKey: "voucherTypes",
  },
  {
    slug: "number-series",
    label: "Number Series",
    path: "/app/finance/masters/number-series",
    statKey: "numberSeries",
  },
  {
    slug: "budget-categories",
    label: "Budget Categories",
    path: "/app/finance/masters/budget-categories",
    statKey: "budgetCategories",
  },
  {
    slug: "asset-categories",
    label: "Asset Categories",
    path: "/app/finance/masters/asset-categories",
    statKey: "assetCategories",
  },
];

export const FINANCE_MASTER_TABS = [...FINANCE_MASTER_PRIMARY_TABS, ...FINANCE_MASTER_MORE_TABS];
