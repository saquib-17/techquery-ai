import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/dashboard/useDashboardSummary";
import {
  getResumesApi,
  uploadResumeApi,
  setPrimaryResumeApi,
  deleteResumeApi,
  analyzeResumeApi,
  getResumeAnalysisApi,
  getParsedResumeDataApi,
} from "./resumes.api";

export const resumeKeys = {
  all: ["resumes"] as const,
  analysis: (id: string) => ["resumes", id, "analysis"] as const,
  parsed: (id: string) => ["resumes", id, "parsed"] as const,
};

export function useResumesQuery() {
  return useQuery({
    queryKey: resumeKeys.all,
    queryFn: getResumesApi,
  });
}

export function useResumeAnalysisQuery(resumeId: string | null) {
  return useQuery({
    queryKey: resumeKeys.analysis(resumeId ?? ""),
    queryFn: () => getResumeAnalysisApi(resumeId!),
    enabled: Boolean(resumeId),
  });
}

export function useParsedResumeQuery(resumeId: string | null) {
  return useQuery({
    queryKey: resumeKeys.parsed(resumeId ?? ""),
    queryFn: () => getParsedResumeDataApi(resumeId!),
    enabled: Boolean(resumeId),
  });
}

export function useUploadResumeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadResumeApi(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resumeKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summary });
    },
  });
}

export function useSetPrimaryResumeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => setPrimaryResumeApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resumeKeys.all });
    },
  });
}

export function useDeleteResumeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteResumeApi(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: resumeKeys.analysis(id) });
      queryClient.removeQueries({ queryKey: resumeKeys.parsed(id) });
      void queryClient.invalidateQueries({ queryKey: resumeKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summary });
    },
  });
}

export function useAnalyzeResumeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => analyzeResumeApi(id),
    onSuccess: (result, id) => {
      queryClient.setQueryData(resumeKeys.analysis(id), result.analysis);
      queryClient.setQueryData(resumeKeys.parsed(id), result.parsedData);
      void queryClient.invalidateQueries({ queryKey: resumeKeys.all, exact: true });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summary });
    },
  });
}
