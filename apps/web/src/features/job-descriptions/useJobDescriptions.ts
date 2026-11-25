import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/dashboard/useDashboardSummary";
import {
  getJobDescriptionsApi,
  createJobDescriptionApi,
  deleteJobDescriptionApi,
  type CreateJdPayload,
} from "./jd.api";

export const jdKeys = {
  all: ["jobDescriptions"] as const,
};

export function useJobDescriptionsQuery() {
  return useQuery({
    queryKey: jdKeys.all,
    queryFn: getJobDescriptionsApi,
  });
}

export function useCreateJobDescriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateJdPayload) => createJobDescriptionApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jdKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summary });
    },
  });
}

export function useDeleteJobDescriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJobDescriptionApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jdKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summary });
    },
  });
}
