import type { MenuSeedNode } from "@/lib/sidebar/menu-seed-data";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const FINANCE_MODULE_DESCRIPTIONS: Record<string, string> = {
  "finance-masters": "Manage all master data used in finance operations.",
  "finance-transactions": "Record and manage day-to-day financial transactions.",
  "finance-general-ledger": "Core accounting ledger, balances, and period controls.",
  "finance-accounts-receivable": "Customer billing, receipts, and receivable tracking.",
  "finance-accounts-payable": "Vendor bills, payments, and payable tracking.",
  "finance-banking-cash": "Bank accounts, cash books, and reconciliation.",
  "finance-budgeting": "Budget planning, allocation, and variance analysis.",
  "finance-fixed-assets": "Asset lifecycle, depreciation, and disposal.",
  "finance-tax-management": "GST, TDS, compliance, and tax reporting.",
  "finance-expense-management": "Employee expenses, claims, and reimbursements.",
  "finance-cost-profit": "Cost centers, profitability, and allocation analysis.",
  "finance-revenue-management": "Revenue recognition, billing, and subscriptions.",
  "finance-project-finance": "Project budgets, billing, and profitability.",
  "finance-payroll-integration": "Payroll posting and employee finance entries.",
  "finance-consolidation": "Multi-company consolidation and group reporting.",
  "finance-approval-workflow": "Configurable approvals across finance processes.",
  "finance-reports-analytics": "Financial statements, KPIs, and custom reports.",
  "finance-settings": "Finance preferences, policies, and integrations.",
};

export const FINANCE_REPORT_DESCRIPTIONS: Record<string, string> = {
  "fin-report-balance-sheet": "Assets, liabilities, and equity position.",
  "fin-report-profit-loss": "Income and expense summary for the period.",
  "fin-report-cash-flow": "Cash inflows and outflows analysis.",
  "fin-report-trial-balance": "Debit and credit balances by account.",
  "fin-report-receivable-aging": "Outstanding receivables by age bucket.",
  "fin-report-payable-aging": "Outstanding payables by age bucket.",
  "fin-report-budget-vs-actual": "Budget performance comparison.",
  "fin-report-kpi-dashboard": "Key finance performance indicators.",
};

function financeItem(groupSlug: string, name: string, icon = "file-text", sortOrder?: number): MenuSeedNode {
  const itemSlug = slugify(name);
  return {
    slug: `fin-${groupSlug}-${itemSlug}`,
    name,
    path: `/app/finance/${groupSlug}/${itemSlug}`,
    icon,
    permissionModule: "finance",
    permissionFeature: "dashboard",
    status: "scope",
    sortOrder,
  };
}

function financeGroup(
  slug: string,
  name: string,
  icon: string,
  items: string[],
  sortOrder: number
): MenuSeedNode {
  return {
    slug: `finance-${slug}`,
    name,
    icon,
    menuType: "group",
    permissionModule: "finance",
    permissionFeature: "dashboard",
    status: "scope",
    sortOrder,
    children: items.map((item, index) => financeItem(slug, item, "file-text", index + 1)),
  };
}

/** Enterprise Finance module sidebar (replaces legacy finance submenu). */
export const FINANCE_MENU_CHILDREN: MenuSeedNode[] = [
  {
    slug: "finance-dashboard",
    name: "Dashboard",
    path: "/app/finance/dashboard",
    icon: "layout-dashboard",
    permissionModule: "finance",
    permissionFeature: "dashboard",
    status: "built",
    sortOrder: 0,
  },
  financeGroup(
    "masters",
    "Masters",
    "database",
    [
      "Chart of Accounts",
      "Account Groups",
      "Financial Dimensions",
      "Cost Centers",
      "Profit Centers",
      "Banks",
      "Payment Terms",
      "Tax Configuration",
      "Currency",
      "Exchange Rates",
      "Financial Year",
      "Accounting Periods",
      "Voucher Types",
      "Number Series",
      "Budget Categories",
      "Asset Categories",
    ],
    1
  ),
  financeGroup(
    "transactions",
    "Transactions",
    "arrow-left-right",
    [
      "Journal Entry",
      "Receipt Voucher",
      "Payment Voucher",
      "Contra Voucher",
      "Debit Note",
      "Credit Note",
      "Bank Transfer",
      "Intercompany Journal",
      "Recurring Journal",
    ],
    2
  ),
  financeGroup(
    "general-ledger",
    "General Ledger",
    "book-open",
    [
      "General Ledger",
      "Trial Balance",
      "Day Book",
      "Opening Balances",
      "Period Closing",
      "Year End Closing",
      "Ledger Reconciliation",
    ],
    3
  ),
  financeGroup(
    "accounts-receivable",
    "Accounts Receivable",
    "user-check",
    [
      "Customers",
      "Customer Invoices",
      "Customer Receipts",
      "Customer Advances",
      "Credit Notes",
      "Refunds",
      "Outstanding Receivables",
      "Aging Analysis",
      "Customer Statements",
    ],
    4
  ),
  financeGroup(
    "accounts-payable",
    "Accounts Payable",
    "users",
    [
      "Vendors",
      "Vendor Bills",
      "Vendor Payments",
      "Vendor Advances",
      "Debit Notes",
      "Refunds",
      "Outstanding Payables",
      "Aging Analysis",
      "Vendor Statements",
    ],
    5
  ),
  financeGroup(
    "banking-cash",
    "Banking & Cash",
    "landmark",
    [
      "Bank Accounts",
      "Cash Book",
      "Bank Book",
      "Bank Reconciliation",
      "Deposits",
      "Withdrawals",
      "Cheque Management",
      "Electronic Payments",
      "Petty Cash",
      "Cash Forecast",
    ],
    6
  ),
  financeGroup(
    "budgeting",
    "Budgeting",
    "pie-chart",
    [
      "Budget Planning",
      "Budget Allocation",
      "Department Budget",
      "Project Budget",
      "Budget Revision",
      "Budget Control",
      "Budget vs Actual",
    ],
    7
  ),
  financeGroup(
    "fixed-assets",
    "Fixed Assets",
    "building",
    [
      "Asset Register",
      "Acquisition",
      "Transfer",
      "Maintenance",
      "Depreciation",
      "Revaluation",
      "Disposal",
      "Asset Audit",
    ],
    8
  ),
  financeGroup(
    "tax-management",
    "Tax Management",
    "percent",
    [
      "GST",
      "TDS",
      "TCS",
      "Income Tax",
      "Tax Filing",
      "GST Returns",
      "E-Invoicing",
      "E-Way Bill",
      "Tax Reports",
    ],
    9
  ),
  financeGroup(
    "expense-management",
    "Expense Management",
    "wallet",
    [
      "Employee Expenses",
      "Travel Expenses",
      "Expense Claims",
      "Reimbursements",
      "Corporate Cards",
      "Expense Approval",
    ],
    10
  ),
  financeGroup(
    "cost-profit-analysis",
    "Cost & Profit Analysis",
    "target",
    [
      "Cost Centers",
      "Profit Centers",
      "Cost Allocation",
      "Project Costing",
      "Department Costing",
      "Activity Costing",
      "Profitability Analysis",
    ],
    11
  ),
  financeGroup(
    "revenue-management",
    "Revenue Management",
    "trending-up",
    [
      "Revenue Recognition",
      "Deferred Revenue",
      "Recurring Billing",
      "Billing Schedule",
      "Subscription Revenue",
    ],
    12
  ),
  financeGroup(
    "project-finance",
    "Project Finance",
    "folder-kanban",
    [
      "Project Budget",
      "Project Expenses",
      "Project Billing",
      "Work in Progress (WIP)",
      "Project Profitability",
    ],
    13
  ),
  financeGroup(
    "payroll-integration",
    "Payroll Integration",
    "banknote",
    [
      "Payroll Posting",
      "Salary Journal",
      "Employee Advances",
      "Employee Loans",
      "Payroll Reconciliation",
    ],
    14
  ),
  financeGroup(
    "financial-consolidation",
    "Financial Consolidation",
    "network",
    [
      "Multi Company",
      "Consolidation",
      "Intercompany Elimination",
      "Group Reporting",
      "Currency Translation",
    ],
    15
  ),
  financeGroup(
    "approval-workflow",
    "Approval Workflow",
    "git-merge",
    [
      "Journal Approval",
      "Invoice Approval",
      "Expense Approval",
      "Payment Approval",
      "Budget Approval",
      "Workflow Designer",
    ],
    16
  ),
  {
    slug: "finance-reports-analytics",
    name: "Reports & Analytics",
    icon: "bar-chart-3",
    menuType: "group",
    permissionModule: "finance",
    permissionFeature: "dashboard",
    status: "scope",
    sortOrder: 17,
    children: [
      {
        slug: "fin-report-financial-dashboard",
        name: "Financial Dashboard",
        path: "/app/finance/reports-analytics/financial-dashboard",
        icon: "layout-dashboard",
        permissionModule: "finance",
        permissionFeature: "dashboard",
        status: "scope",
        sortOrder: 1,
      },
      {
        slug: "fin-report-balance-sheet",
        name: "Balance Sheet",
        path: "/app/finance/reports-analytics/balance-sheet",
        icon: "scale",
        permissionModule: "finance",
        permissionFeature: "dashboard",
        status: "scope",
        sortOrder: 2,
      },
      {
        slug: "fin-report-profit-loss",
        name: "Profit & Loss",
        path: "/app/finance/reports-analytics/profit-loss",
        icon: "line-chart",
        permissionModule: "finance",
        permissionFeature: "dashboard",
        status: "scope",
        sortOrder: 3,
      },
      {
        slug: "fin-report-cash-flow",
        name: "Cash Flow",
        path: "/app/finance/reports-analytics/cash-flow",
        icon: "waves",
        permissionModule: "finance",
        permissionFeature: "dashboard",
        status: "scope",
        sortOrder: 4,
      },
      {
        slug: "fin-report-trial-balance",
        name: "Trial Balance",
        path: "/app/finance/reports-analytics/trial-balance",
        icon: "book-open",
        permissionModule: "finance",
        permissionFeature: "dashboard",
        status: "scope",
        sortOrder: 5,
      },
      ...[
        "General Ledger",
        "Day Book",
        "Cash Book",
        "Bank Book",
        "Receivable Reports",
        "Payable Reports",
        "Budget Reports",
        "Cost Center Reports",
        "Profit Center Reports",
        "Asset Reports",
        "Tax Reports",
        "Financial Ratios",
      ].map((name, index) => financeItem("reports-analytics", name, "file-text", index + 6)),
      {
        slug: "fin-report-kpi-dashboard",
        name: "KPI Dashboard",
        path: "/app/finance/reports-analytics/kpi-dashboard",
        icon: "gauge",
        permissionModule: "finance",
        permissionFeature: "dashboard",
        status: "scope",
        sortOrder: 19,
      },
      financeItem("reports-analytics", "Custom Reports", "blocks", 20),
    ],
  },
  financeGroup(
    "settings",
    "Settings",
    "settings-2",
    [
      "Finance Preferences",
      "Approval Matrix",
      "Voucher Configuration",
      "Accounting Policies",
      "Auto Numbering",
      "Audit Logs",
      "Notification Rules",
      "Integration Settings",
    ],
    18
  ),
];

export const LEGACY_FINANCE_MENU_SLUGS = [
  "accounting",
  "invoicing",
  "budgeting",
  "expenses",
  "tax-mgmt",
  "banking",
  "vendor-payments",
  "purchase-orders",
  "financial-reports",
  "multi-currency",
  "cost-centers",
  "services-hub",
  "service-catalog",
  "pricing-rules",
  "packages",
  "sla",
  "service-contracts",
  "amc-management",
  "subscription-billing",
  "service-requests",
] as const;
