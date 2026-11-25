import { z } from "zod";
import {
  DSA_SHEET_CATEGORIES,
  DSA_SHEET_PROBLEMS,
  type DsaSheetCategorySummary,
  type DsaSheetProblemWithProgress,
  type DsaSheetStatus,
  type DsaSheetSummary,
  type DsaSheetWalkthroughDto,
  type UpdateDsaSheetProgressInput,
} from "@techquery/shared";
import { prisma } from "../../core/database/index.js";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { NotFoundError } from "../../core/errors/AppError.js";

const WalkthroughAISchema = z.object({
  patternRecognition: z.string().min(10),
  bruteForceApproach: z.string().min(10),
  optimalApproach: z.string().min(10),
  timeComplexity: z.string().min(2),
  spaceComplexity: z.string().min(2),
  edgeCases: z.array(z.string().min(3)).min(1).max(6),
});

const PROBLEM_BY_SLUG = new Map(
  DSA_SHEET_PROBLEMS.map((p) => [p.slug, p])
);

export class DsaSheetService {
  constructor(private ai: AIGateway = aiGateway) {}

  public async getSheetForUser(userId: string): Promise<{
    summary: DsaSheetSummary;
    problems: DsaSheetProblemWithProgress[];
  }> {
    const progressRows = await prisma.userDsaSheetProgress.findMany({
      where: { userId },
    });

    const progressMap = new Map(
      progressRows.map((row) => [row.problemSlug, row])
    );

    const byDifficulty = {
      EASY: { total: 0, solved: 0 },
      MEDIUM: { total: 0, solved: 0 },
      HARD: { total: 0, solved: 0 },
    };

    const categoryMap = new Map<string, DsaSheetCategorySummary>(
      DSA_SHEET_CATEGORIES.map((category) => [
        category,
        { category, total: 0, solved: 0, revision: 0 },
      ])
    );

    let solved = 0;
    let revision = 0;

    const problems: DsaSheetProblemWithProgress[] = DSA_SHEET_PROBLEMS.map(
      (item) => {
        const saved = progressMap.get(item.slug);
        const status: DsaSheetStatus =
          (saved?.status as DsaSheetStatus) ?? "UNSOLVED";

        if (status === "SOLVED") solved += 1;
        else if (status === "REVISION") revision += 1;

        byDifficulty[item.difficulty].total += 1;
        if (status === "SOLVED") {
          byDifficulty[item.difficulty].solved += 1;
        }

        const catStat = categoryMap.get(item.category);
        if (catStat) {
          catStat.total += 1;
          if (status === "SOLVED") catStat.solved += 1;
          else if (status === "REVISION") catStat.revision += 1;
        }

        return {
          ...item,
          status,
          notes: saved?.notes ?? "",
          updatedAt: saved?.updatedAt ? saved.updatedAt.toISOString() : null,
        };
      }
    );

    return {
      summary: {
        total: DSA_SHEET_PROBLEMS.length,
        solved,
        revision,
        unsolved: DSA_SHEET_PROBLEMS.length - solved - revision,
        byDifficulty,
        byCategory: DSA_SHEET_CATEGORIES.map((c) => categoryMap.get(c)!),
      },
      problems,
    };
  }

  public async updateProgress(
    userId: string,
    problemSlug: string,
    input: UpdateDsaSheetProgressInput
  ) {
    if (!PROBLEM_BY_SLUG.has(problemSlug)) {
      throw new NotFoundError(
        "DSA sheet problem not found",
        "DSA_SHEET_PROBLEM_NOT_FOUND"
      );
    }

    const row = await prisma.userDsaSheetProgress.upsert({
      where: { userId_problemSlug: { userId, problemSlug } },
      update: {
        status: input.status,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      create: {
        userId,
        problemSlug,
        status: input.status,
        notes: input.notes ?? "",
      },
    });

    return {
      problemSlug: row.problemSlug,
      status: row.status as DsaSheetStatus,
      notes: row.notes ?? "",
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  public async generateWalkthrough(
    userId: string,
    problemSlug: string
  ): Promise<DsaSheetWalkthroughDto> {
    const problem = PROBLEM_BY_SLUG.get(problemSlug);
    if (!problem) {
      throw new NotFoundError(
        "DSA sheet problem not found",
        "DSA_SHEET_PROBLEM_NOT_FOUND"
      );
    }

    const prompt = `You are a Principal Algorithms Interviewer. Provide a concise, structured walkthrough for "${problem.title}" (${problem.difficulty}, Pattern: ${problem.category} -> ${problem.subPattern}).
Key Hint: ${problem.patternClue}

Return ONLY raw JSON matching this schema:
{
  "patternRecognition": "string - 1-2 sentences explaining why this problem maps to ${problem.subPattern}",
  "bruteForceApproach": "string - 1-2 sentences describing the naive baseline and its bottleneck",
  "optimalApproach": "string - 2-4 sentences explaining the optimal algorithm step by step",
  "timeComplexity": "string - e.g. O(n)",
  "spaceComplexity": "string - e.g. O(n)",
  "edgeCases": ["string - edge case 1", "string - edge case 2", "string - edge case 3"]
}`;

    const fallback = (): z.infer<typeof WalkthroughAISchema> => ({
      patternRecognition: `This problem belongs to ${problem.category} (${problem.subPattern}). Recognize the invariant: ${problem.patternClue}`,
      bruteForceApproach:
        "A brute-force approach checks all candidate pairs, subarrays, or paths directly, resulting in polynomial or exponential time.",
      optimalApproach: `Apply ${problem.subPattern} to avoid redundant work: ${problem.patternClue}`,
      timeComplexity: problem.difficulty === "HARD" ? "O(n log n)" : "O(n)",
      spaceComplexity: "O(n)",
      edgeCases: [
        "Minimum input size (empty or 1 element)",
        "Duplicate or negative values",
        "Already sorted / worst-case skewed input",
      ],
    });

    try {
      const result = await this.ai.completeStructured(
        prompt,
        WalkthroughAISchema,
        {
          taskType: "AGEN",
          userId,
          rawInputText: `${problem.title} ${problem.subPattern}`,
          fallbackFn: fallback,
        }
      );
      return { problemSlug, ...result.data };
    } catch {
      return { problemSlug, ...fallback() };
    }
  }
}

export const dsaSheetService = new DsaSheetService();
