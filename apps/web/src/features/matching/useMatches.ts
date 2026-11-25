import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/dashboard/useDashboardSummary";
import {
  getMatchesApi,
  evaluateMatchApi,
  deleteMatchApi,
  type CreateMatchPayload,
} from "./matching.api";

export const matchKeys = {
  all: ["matches"] as const,
};

export function useMatchesQuery() {
  return useQuery({
    queryKey: matchKeys.all,
    queryFn: getMatchesApi,
  });
}

export function useEvaluateMatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMatchPayload) => evaluateMatchApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matchKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summary });
    },
  });
}

export function useDeleteMatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMatchApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matchKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summary });
    },
  });
}
