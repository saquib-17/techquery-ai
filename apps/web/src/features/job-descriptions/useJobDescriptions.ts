import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/dashboard/useDashboardSummary";
import {
  getJobDescriptionsApi,
  getJobDescriptionByIdApi,
  createJobDescriptionApi,
  deleteJobDescriptionApi,
  type CreateJdPayload,
} from "./jd.api";

export const jdKeys = {
  all: ["jobDescriptions"] as const,
  detail: (id: string) => ["jobDescriptions", id] as const,
};

export function useJobDescriptionsQuery() {
  return useQuery({
    queryKey: jdKeys.all,
    queryFn: getJobDescriptionsApi,
  });
}

export function useJobDescriptionDetailQuery(id: string | null, enabled = true) {
  return useQuery({
    queryKey: jdKeys.detail(id ?? ""),
    queryFn: () => getJobDescriptionByIdApi(id!),
    enabled: Boolean(id) && enabled,
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
