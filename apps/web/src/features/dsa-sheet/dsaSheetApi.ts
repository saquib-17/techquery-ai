import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DsaSheetProblemWithProgress,
  DsaSheetStatus,
  DsaSheetSummary,
  DsaSheetWalkthroughDto,
  UpdateDsaSheetProgressInput,
} from "@techquery/shared";
import { api } from "@/lib/api";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface DsaSheetResponse {
  summary: DsaSheetSummary;
  problems: DsaSheetProblemWithProgress[];
}

export const dsaSheetKeys = {
  all: ["dsa-sheet"] as const,
};

export async function getDsaSheetApi(): Promise<DsaSheetResponse> {
  const res = await api.get<ApiEnvelope<DsaSheetResponse>>("/dsa-sheet");
  return res.data.data;
}

export async function updateDsaSheetProgressApi(
  problemSlug: string,
  payload: UpdateDsaSheetProgressInput
): Promise<{
  problemSlug: string;
  status: DsaSheetStatus;
  notes: string;
  updatedAt: string;
}> {
  const res = await api.put<
    ApiEnvelope<{
      progress: {
        problemSlug: string;
        status: DsaSheetStatus;
        notes: string;
        updatedAt: string;
      };
    }>
  >(`/dsa-sheet/${problemSlug}/progress`, payload);
  return res.data.data.progress;
}

export async function generateDsaWalkthroughApi(
  problemSlug: string
): Promise<DsaSheetWalkthroughDto> {
  const res = await api.post<
    ApiEnvelope<{ walkthrough: DsaSheetWalkthroughDto }>
  >(`/dsa-sheet/${problemSlug}/walkthrough`);
  return res.data.data.walkthrough;
}

export function useDsaSheetQuery() {
  return useQuery({
    queryKey: dsaSheetKeys.all,
    queryFn: getDsaSheetApi,
  });
}

export function useUpdateDsaSheetProgressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      problemSlug,
      ...payload
    }: UpdateDsaSheetProgressInput & { problemSlug: string }) =>
      updateDsaSheetProgressApi(problemSlug, payload),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: dsaSheetKeys.all });
      const previous = queryClient.getQueryData<DsaSheetResponse>(
        dsaSheetKeys.all
      );

      if (previous) {
        const updatedProblems = previous.problems.map((p) =>
          p.slug === vars.problemSlug
            ? {
                ...p,
                status: vars.status,
                notes: vars.notes !== undefined ? vars.notes : p.notes,
              }
            : p
        );

        let solved = 0;
        let revision = 0;
        const byDifficulty = {
          EASY: { total: 0, solved: 0 },
          MEDIUM: { total: 0, solved: 0 },
          HARD: { total: 0, solved: 0 },
        };
        const catStats = new Map<
          string,
          { total: number; solved: number; revision: number }
        >();

        for (const p of updatedProblems) {
          if (p.status === "SOLVED") solved += 1;
          else if (p.status === "REVISION") revision += 1;

          byDifficulty[p.difficulty].total += 1;
          if (p.status === "SOLVED") byDifficulty[p.difficulty].solved += 1;

          const cur = catStats.get(p.category) ?? {
            total: 0,
            solved: 0,
            revision: 0,
          };
          cur.total += 1;
          if (p.status === "SOLVED") cur.solved += 1;
          else if (p.status === "REVISION") cur.revision += 1;
          catStats.set(p.category, cur);
        }

        queryClient.setQueryData<DsaSheetResponse>(dsaSheetKeys.all, {
          problems: updatedProblems,
          summary: {
            total: updatedProblems.length,
            solved,
            revision,
            unsolved: updatedProblems.length - solved - revision,
            byDifficulty,
            byCategory: previous.summary.byCategory.map((c) => ({
              ...c,
              ...(catStats.get(c.category) ?? {}),
            })),
          },
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dsaSheetKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: dsaSheetKeys.all });
    },
  });
}

export function useGenerateDsaWalkthroughMutation() {
  return useMutation({
    mutationFn: (problemSlug: string) => generateDsaWalkthroughApi(problemSlug),
  });
}
