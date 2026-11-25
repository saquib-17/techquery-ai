import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteAnswerApi,
  generateAnswerApi,
  type GenerateAnswerPayload,
} from "./answers.api";
import { questionSetKeys } from "./useQuestions";

export function useGenerateAnswerMutation(questionSetId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateAnswerPayload) => generateAnswerApi(payload),
    onSuccess: () => {
      if (questionSetId) {
        void queryClient.invalidateQueries({
          queryKey: questionSetKeys.detail(questionSetId),
        });
      } else {
        void queryClient.invalidateQueries({ queryKey: questionSetKeys.all });
      }
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useDeleteAnswerMutation(questionSetId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => deleteAnswerApi(questionId),
    onSuccess: () => {
      if (questionSetId) {
        void queryClient.invalidateQueries({
          queryKey: questionSetKeys.detail(questionSetId),
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}
