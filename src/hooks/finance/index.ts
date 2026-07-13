import { useQuery } from "@tanstack/react-query";
import type {
  FinanceActivity,
  FinanceDashboardModule,
  FinanceDashboardReport,
  FinanceDashboardStats,
} from "@/repositories/finance/dashboard";

export type FinanceDashboardResponse = {
  stats: FinanceDashboardStats;
  modules: FinanceDashboardModule[];
  reports: FinanceDashboardReport[];
  activities: FinanceActivity[];
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "Request failed");
  return json.data as T;
}

export function useFinanceDashboard() {
  return useQuery({
    queryKey: ["finance-dashboard"],
    queryFn: () => getJson<FinanceDashboardResponse>("/api/finance/dashboard"),
  });
}
