import { api } from "@/lib/api";
import type { AnswerStyle, ModelAnswer } from "./questions.api";

export interface GenerateAnswerPayload {
  questionId: string;
  style: AnswerStyle;
  regenerate?: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function generateAnswerApi(
  payload: GenerateAnswerPayload,
): Promise<ModelAnswer> {
  const res = await api.post<ApiEnvelope<{ answer: ModelAnswer }>>(
    "/answers/generate",
    {
      questionId: payload.questionId,
      style: payload.style,
      regenerate: payload.regenerate ?? false,
    },
  );
  return res.data.data.answer;
}

export async function getAnswerByQuestionIdApi(
  questionId: string,
): Promise<ModelAnswer> {
  const res = await api.get<ApiEnvelope<{ answer: ModelAnswer }>>(
    `/answers/${questionId}`,
  );
  return res.data.data.answer;
}

export async function deleteAnswerApi(questionId: string): Promise<void> {
  await api.delete(`/answers/${questionId}`);
}
