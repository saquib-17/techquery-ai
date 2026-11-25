import { useQuery } from "@tanstack/react-query";
import { getDashboardSummaryApi } from "./dashboard.api";

export const dashboardKeys = {
  summary: ["dashboard", "summary"] as const,
};

export function useDashboardSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: getDashboardSummaryApi,
    enabled,
  });
}
