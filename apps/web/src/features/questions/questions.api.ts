import { api } from "@/lib/api";

export type QuestionCategory =
  | "THEORETICAL"
  | "CODING"
  | "SYSTEM_DESIGN"
  | "BEHAVIORAL"
  | "PROJECT_DEFENSE";

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

export type AnswerStyle = "CONCISE" | "DETAILED" | "INTERVIEW";

export interface ModelAnswer {
  id: string;
  questionId: string;
  userId: string;
  style: AnswerStyle;
  shortSummary: string;
  detailedExplanation: string;
  codeSnippet: string | null;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  commonMistakes: string[];
  providerUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionItem {
  id: string;
  questionSetId: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  targetedSkill: string;
  questionText: string;
  interviewerIntent: string;
  keyEvaluationPoints: string[];
  createdAt: string;
  updatedAt?: string;
  answer?: ModelAnswer | null;
}

export interface QuestionSetSummary {
  id: string;
  userId: string;
  resumeId: string | null;
  jdId: string | null;
  matchId: string | null;
  title: string;
  topicFocus: string;
  difficulty: QuestionDifficulty;
  totalCount: number;
  providerUsed: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionSetDetail extends QuestionSetSummary {
  questions: QuestionItem[];
}

export interface GenerateQuestionSetPayload {
  resumeId?: string;
  jdId?: string;
  matchId?: string;
  title?: string;
  topicFocus: string;
  difficulty: QuestionDifficulty;
  categories: QuestionCategory[];
  count: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getQuestionSetsApi(): Promise<QuestionSetSummary[]> {
  const res = await api.get<ApiEnvelope<{ questionSets: QuestionSetSummary[] }>>(
    "/question-sets",
  );
  return res.data.data.questionSets;
}

export async function getQuestionSetDetailApi(
  id: string,
): Promise<QuestionSetDetail> {
  const res = await api.get<ApiEnvelope<{ questionSet: QuestionSetDetail }>>(
    `/question-sets/${id}`,
  );
  return res.data.data.questionSet;
}

export async function generateQuestionSetApi(
  payload: GenerateQuestionSetPayload,
): Promise<QuestionSetDetail> {
  const res = await api.post<ApiEnvelope<{ questionSet: QuestionSetDetail }>>(
    "/questions/generate",
    payload,
  );
  return res.data.data.questionSet;
}

export async function deleteQuestionSetApi(id: string): Promise<void> {
  await api.delete(`/question-sets/${id}`);
}

export async function exportQuestionSetPdf(
  id: string,
  title: string,
): Promise<void> {
  const res = await api.get<Blob>(`/question-sets/${id}/export/pdf`, {
    responseType: "blob",
  });

  const safeName =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "question-set";

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
