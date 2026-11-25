import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUsageQuotasApi,
  updateTierApi,
  type UserTier,
} from "./usage.api";

export const usageKeys = {
  quotas: ["usage", "quotas"] as const,
};

export function useUsageQuotasQuery() {
  return useQuery({
    queryKey: usageKeys.quotas,
    queryFn: getUsageQuotasApi,
  });
}

export function useUpdateTierMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tier: UserTier) => updateTierApi(tier),
    onSuccess: (updated) => {
      queryClient.setQueryData(usageKeys.quotas, {
        tier: updated.tier,
        quotas: updated.quotas,
      });
      void queryClient.invalidateQueries({ queryKey: usageKeys.quotas });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}
