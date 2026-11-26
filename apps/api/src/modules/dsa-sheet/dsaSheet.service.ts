import { z } from "zod";
import {
  DSA_SHEET_CATEGORIES,
  DSA_SHEET_PROBLEMS,
  type DsaSheetCategorySummary,
  type DsaSheetProblemWithProgress,
  type DsaSheetStatus,
  type DsaSheetSummary,
  type DsaSheetWalkthroughDto,
  type SupportedCodeLanguage,
  type UpdateDsaSheetProgressInput,
} from "@techquery/shared";
import { prisma } from "../../core/database/index.js";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { NotFoundError } from "../../core/errors/AppError.js";

const ComplexityPairSchema = z.object({
  time: z.string().min(2),
  space: z.string().min(2),
});

const WalkthroughAISchema = z.object({
  problemExplanation: z.string().min(15),
  patternRecognition: z.string().min(10),
  bruteForceApproach: z.string().min(10),
  bruteForceComplexity: ComplexityPairSchema,
  bruteForceCode: z.string().min(10),
  optimalApproach: z.string().min(10),
  optimalComplexity: ComplexityPairSchema,
  optimalCode: z.string().min(10),
  edgeCases: z.array(z.string().min(3)).min(1).max(6),
});

const PROBLEM_BY_SLUG = new Map(
  DSA_SHEET_PROBLEMS.map((p) => [p.slug, p])
);

const LANGUAGE_LABELS: Record<SupportedCodeLanguage, string> = {
  java: "Java",
  python: "Python 3",
  cpp: "C++17",
  javascript: "JavaScript",
};

function buildFallbackCode(
  title: string,
  approach: "Brute Force" | "Optimal",
  clue: string,
  language: SupportedCodeLanguage
): string {
  if (language === "python") {
    return `class Solution:\n    def solve(self, nums):\n        # ${approach} approach for ${title}\n        # ${clue}\n        pass`;
  }
  if (language === "cpp") {
    return `class Solution {\npublic:\n    void solve() {\n        // ${approach} approach for ${title}\n        // ${clue}\n    }\n};`;
  }
  if (language === "javascript") {
    return `/**\n * ${approach} approach for ${title}\n * ${clue}\n */\nvar solve = function(input) {\n  // Implement ${approach.toLowerCase()} logic\n};`;
  }
  return `class Solution {\n  public void solve() {\n    // ${approach} approach for ${title}\n    // ${clue}\n  }\n}`;
}

export class DsaSheetService {
  private readonly walkthroughCache = new Map<string, DsaSheetWalkthroughDto>();

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
    problemSlug: string,
    language: SupportedCodeLanguage = "java"
  ): Promise<DsaSheetWalkthroughDto> {
    const problem = PROBLEM_BY_SLUG.get(problemSlug);
    if (!problem) {
      throw new NotFoundError(
        "DSA sheet problem not found",
        "DSA_SHEET_PROBLEM_NOT_FOUND"
      );
    }

    const cacheKey = `${problemSlug}:${language}`;
    const cached = this.walkthroughCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const langLabel = LANGUAGE_LABELS[language];
    const prompt = `You are a Principal Algorithms Interviewer. Provide a clear, structured walkthrough in ${langLabel} for LeetCode problem "${problem.title}" (${problem.difficulty}, Category: ${problem.category}, Sub-Pattern: ${problem.subPattern}).
Key Hint: ${problem.patternClue}

Return ONLY raw JSON matching this schema:
{
  "problemExplanation": "string - 2-4 clear sentences explaining the problem goal, input/output, and a concrete example in plain English",
  "patternRecognition": "string - 1-2 sentences explaining why this problem maps to ${problem.subPattern}",
  "bruteForceApproach": "string - 2-3 sentences describing the naive baseline and its bottleneck",
  "bruteForceComplexity": { "time": "string - e.g. O(n^2)", "space": "string - e.g. O(1)" },
  "bruteForceCode": "string - clean, properly indented multi-line LeetCode-style class Solution (or function for JS) in ${langLabel} separated by \\n (NEVER minified on one line)",
  "optimalApproach": "string - 2-4 sentences explaining the optimal algorithm and key insight",
  "optimalComplexity": { "time": "string - e.g. O(n)", "space": "string - e.g. O(n)" },
  "optimalCode": "string - clean, properly indented multi-line LeetCode-style class Solution (or function for JS) in ${langLabel} separated by \\n (NEVER minified on one line)",
  "edgeCases": ["string - edge case 1", "string - edge case 2", "string - edge case 3"]
}

CRITICAL: Format bruteForceCode and optimalCode with proper 4-space indentation and \\n line breaks.`;

    const fallback = (): z.infer<typeof WalkthroughAISchema> => ({
      problemExplanation: `${problem.title} asks you to solve a classic ${problem.difficulty.toLowerCase()} interview problem in ${problem.category}. Given the input constraints, you must compute the exact target output efficiently while handling boundary inputs.`,
      patternRecognition: `This problem maps to ${problem.subPattern}. Key invariant: ${problem.patternClue}`,
      bruteForceApproach:
        "A brute-force baseline checks all candidate pairs, subarrays, or paths directly via nested loops or exhaustive recursion, which exceeds time limits on large inputs.",
      bruteForceComplexity: { time: "O(n^2)", space: "O(1)" },
      bruteForceCode: buildFallbackCode(
        problem.title,
        "Brute Force",
        problem.patternClue,
        language
      ),
      optimalApproach: `Apply ${problem.subPattern} to eliminate redundant work: ${problem.patternClue}`,
      optimalComplexity: {
        time: problem.difficulty === "HARD" ? "O(n log n)" : "O(n)",
        space: "O(n)",
      },
      optimalCode: buildFallbackCode(
        problem.title,
        "Optimal",
        problem.patternClue,
        language
      ),
      edgeCases: [
        "Minimum input size (empty or single-element input)",
        "Duplicate, zero, or negative values",
        "Already sorted or worst-case skewed input",
      ],
    });

    const normalizeCode = (raw: string) =>
      raw.replace(/\r\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, "    ");

    let dto: DsaSheetWalkthroughDto;
    try {
      const result = await this.ai.completeStructured(
        prompt,
        WalkthroughAISchema,
        {
          taskType: "AGEN",
          userId,
          rawInputText: `${problem.title} ${problem.subPattern} ${language}`,
          fallbackFn: fallback,
        }
      );
      dto = {
        problemSlug,
        language,
        ...result.data,
        bruteForceCode: normalizeCode(result.data.bruteForceCode),
        optimalCode: normalizeCode(result.data.optimalCode),
      };
    } catch {
      dto = { problemSlug, language, ...fallback() };
    }

    if (this.walkthroughCache.size >= 500) {
      const firstKey = this.walkthroughCache.keys().next().value;
      if (firstKey) this.walkthroughCache.delete(firstKey);
    }
    this.walkthroughCache.set(cacheKey, dto);
    return dto;
  }
}

export const dsaSheetService = new DsaSheetService();
