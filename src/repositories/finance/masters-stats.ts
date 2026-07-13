import { createAdminClient } from "@/lib/supabase/admin";
import type { FinanceMasterStatKeys } from "@/lib/finance/masters-tabs";

async function countTable(tenantId: string, table: string) {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function getFinanceMasterStats(tenantId: string): Promise<FinanceMasterStatKeys> {
  const [
    chartOfAccounts,
    accountGroups,
    financialDimensions,
    costCenters,
    banks,
  ] = await Promise.all([
    countTable(tenantId, "finance_chart_of_accounts"),
    countTable(tenantId, "finance_account_groups"),
    countTable(tenantId, "finance_financial_dimensions"),
    countTable(tenantId, "finance_cost_centers"),
    countTable(tenantId, "finance_bank_accounts"),
  ]);

  return {
    chartOfAccounts,
    accountGroups,
    financialDimensions,
    costCenters,
    profitCenters: 0,
    banks,
    taxConfiguration: 0,
    paymentTerms: 0,
    currency: 0,
    exchangeRates: 0,
    financialYear: 0,
    accountingPeriods: 0,
    voucherTypes: 0,
    numberSeries: 0,
    budgetCategories: 0,
    assetCategories: 0,
  };
}
