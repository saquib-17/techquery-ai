import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteQuestionSetApi,
  generateQuestionSetApi,
  getQuestionSetDetailApi,
  getQuestionSetsApi,
  type GenerateQuestionSetPayload,
  type QuestionSetDetail,
} from "./questions.api";

export const questionSetKeys = {
  all: ["questionSets"] as const,
  detail: (id: string) => ["questionSets", id] as const,
};

export function useQuestionSetsQuery() {
  return useQuery({
    queryKey: questionSetKeys.all,
    queryFn: getQuestionSetsApi,
  });
}

export function useQuestionSetDetailQuery(id: string | null) {
  return useQuery({
    queryKey: questionSetKeys.detail(id ?? ""),
    queryFn: () => getQuestionSetDetailApi(id!),
    enabled: Boolean(id),
  });
}

export function useGenerateQuestionSetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateQuestionSetPayload) =>
      generateQuestionSetApi(payload),
    onSuccess: (created: QuestionSetDetail) => {
      queryClient.setQueryData(questionSetKeys.detail(created.id), created);
      void queryClient.invalidateQueries({ queryKey: questionSetKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useDeleteQuestionSetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteQuestionSetApi(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: questionSetKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: questionSetKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}
