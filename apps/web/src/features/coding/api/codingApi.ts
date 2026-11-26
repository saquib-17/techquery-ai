import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssessmentSessionDto,
  CodeExecutionResultDto,
  CodingProblemDto,
  DsaPattern,
  ProblemDifficulty,
  RunCodeInput,
  SaveAssessmentDraftInput,
  StartAssessmentInput,
  SupportedCodeLanguage,
} from "@techquery/shared";
import { api } from "@/lib/api";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface CodingSubmissionSummary {
  id: string;
  problemId: string;
  language: SupportedCodeLanguage;
  verdict: string;
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  memoryKb: number;
  createdAt: string;
}

export async function getCodingProblemsApi(filters?: {
  difficulty?: ProblemDifficulty;
  pattern?: DsaPattern;
}): Promise<CodingProblemDto[]> {
  const params = new URLSearchParams();
  if (filters?.difficulty) params.set("difficulty", filters.difficulty);
  if (filters?.pattern && filters.pattern !== "ALL_PATTERNS") {
    params.set("pattern", filters.pattern);
  }
  const qs = params.toString();
  const res = await api.get<ApiEnvelope<{ problems: CodingProblemDto[] }>>(
    `/coding/problems${qs ? `?${qs}` : ""}`
  );
  return res.data.data.problems;
}

export async function getCodingProblemByIdApi(id: string): Promise<{
  problem: CodingProblemDto;
  submissions: CodingSubmissionSummary[];
}> {
  const res = await api.get<
    ApiEnvelope<{
      problem: CodingProblemDto;
      submissions: CodingSubmissionSummary[];
    }>
  >(`/coding/problems/${id}`);
  return res.data.data;
}

export async function generateCodingProblemApi(payload: {
  difficulty: ProblemDifficulty;
  pattern: DsaPattern;
}): Promise<CodingProblemDto> {
  const res = await api.post<ApiEnvelope<{ problem: CodingProblemDto }>>(
    "/coding/problems/generate",
    payload
  );
  return res.data.data.problem;
}

export async function runCodingCodeApi(
  payload: RunCodeInput
): Promise<CodeExecutionResultDto> {
  const res = await api.post<ApiEnvelope<{ result: CodeExecutionResultDto }>>(
    "/coding/run",
    payload
  );
  return res.data.data.result;
}

export async function getActiveAssessmentApi(): Promise<AssessmentSessionDto | null> {
  const res = await api.get<ApiEnvelope<{ session: AssessmentSessionDto | null }>>(
    "/assessments/active"
  );
  return res.data.data.session;
}

export async function startAssessmentApi(
  payload: StartAssessmentInput
): Promise<AssessmentSessionDto> {
  const res = await api.post<ApiEnvelope<{ session: AssessmentSessionDto }>>(
    "/assessments",
    payload
  );
  return res.data.data.session;
}

export async function getAssessmentHistoryApi(): Promise<AssessmentSessionDto[]> {
  const res = await api.get<ApiEnvelope<{ sessions: AssessmentSessionDto[] }>>(
    "/assessments/history"
  );
  return res.data.data.sessions;
}

export async function getAssessmentByIdApi(
  id: string
): Promise<AssessmentSessionDto> {
  const res = await api.get<ApiEnvelope<{ session: AssessmentSessionDto }>>(
    `/assessments/${id}`
  );
  return res.data.data.session;
}

export async function saveAssessmentDraftApi(
  sessionId: string,
  payload: SaveAssessmentDraftInput
): Promise<AssessmentSessionDto> {
  const res = await api.put<ApiEnvelope<{ session: AssessmentSessionDto }>>(
    `/assessments/${sessionId}/draft`,
    payload
  );
  return res.data.data.session;
}

export async function finishAssessmentApi(
  sessionId: string
): Promise<AssessmentSessionDto> {
  const res = await api.post<ApiEnvelope<{ session: AssessmentSessionDto }>>(
    `/assessments/${sessionId}/finish`
  );
  return res.data.data.session;
}

export async function cancelAssessmentApi(
  sessionId: string
): Promise<AssessmentSessionDto> {
  const res = await api.post<ApiEnvelope<{ session: AssessmentSessionDto }>>(
    `/assessments/${sessionId}/cancel`
  );
  return res.data.data.session;
}

export async function deleteAssessmentSessionApi(
  sessionId: string
): Promise<{ deleted: true; id: string }> {
  const res = await api.delete<ApiEnvelope<{ deleted: true; id: string }>>(
    `/assessments/${sessionId}`
  );
  return res.data.data;
}

export async function clearAssessmentHistoryApi(): Promise<{
  deletedCount: number;
}> {
  const res = await api.delete<ApiEnvelope<{ deletedCount: number }>>(
    "/assessments"
  );
  return res.data.data;
}

function purgeSessionDraftsFromLocalStorage(sessionId: string): void {
  const prefix = `tq_coding_draft_${sessionId}_`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => window.localStorage.removeItem(k));
}

export const codingKeys = {
  problems: (filters?: { difficulty?: ProblemDifficulty; pattern?: DsaPattern }) =>
    ["coding", "problems", filters ?? {}] as const,
  problem: (id: string) => ["coding", "problem", id] as const,
  activeAssessment: ["assessments", "active"] as const,
  history: ["assessments", "history"] as const,
  assessment: (id: string) => ["assessments", id] as const,
};

export function useCodingProblemsQuery(filters?: {
  difficulty?: ProblemDifficulty;
  pattern?: DsaPattern;
}) {
  return useQuery({
    queryKey: codingKeys.problems(filters),
    queryFn: () => getCodingProblemsApi(filters),
  });
}

export function useCodingProblemQuery(id: string | null) {
  return useQuery({
    queryKey: codingKeys.problem(id ?? ""),
    queryFn: () => getCodingProblemByIdApi(id!),
    enabled: Boolean(id),
  });
}

export function useActiveAssessmentQuery() {
  return useQuery({
    queryKey: codingKeys.activeAssessment,
    queryFn: getActiveAssessmentApi,
    staleTime: 0,
  });
}

export function useAssessmentHistoryQuery() {
  return useQuery({
    queryKey: codingKeys.history,
    queryFn: getAssessmentHistoryApi,
  });
}

export function useGenerateCodingProblemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateCodingProblemApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["coding", "problems"] });
    },
  });
}

export function useRunCodingCodeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runCodingCodeApi,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: codingKeys.problem(variables.problemId),
      });
      if (variables.assessmentSessionId) {
        void queryClient.invalidateQueries({
          queryKey: codingKeys.activeAssessment,
        });
      }
    },
  });
}

export function useStartAssessmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startAssessmentApi,
    onSuccess: (session) => {
      queryClient.setQueryData(codingKeys.activeAssessment, session);
    },
  });
}

export function useFinishAssessmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: finishAssessmentApi,
    onSuccess: () => {
      queryClient.setQueryData(codingKeys.activeAssessment, null);
      void queryClient.invalidateQueries({ queryKey: codingKeys.history });
    },
  });
}

export function useCancelAssessmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelAssessmentApi,
    onSuccess: () => {
      queryClient.setQueryData(codingKeys.activeAssessment, null);
      void queryClient.invalidateQueries({ queryKey: codingKeys.history });
    },
  });
}

export function useDeleteAssessmentSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAssessmentSessionApi,
    onSuccess: (_data, sessionId) => {
      purgeSessionDraftsFromLocalStorage(sessionId);
      void queryClient.invalidateQueries({ queryKey: codingKeys.history });
      void queryClient.invalidateQueries({ queryKey: codingKeys.activeAssessment });
    },
  });
}

export function useClearAssessmentHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearAssessmentHistoryApi,
    onSuccess: () => {
      const history = queryClient.getQueryData<AssessmentSessionDto[]>(
        codingKeys.history
      );
      if (history) {
        history.forEach((s) => purgeSessionDraftsFromLocalStorage(s.id));
      }
      queryClient.setQueryData(codingKeys.history, []);
      void queryClient.invalidateQueries({ queryKey: codingKeys.history });
    },
  });
}
