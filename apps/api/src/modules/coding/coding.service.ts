import { randomUUID } from "node:crypto";
import type { CodingProblem, CodingSubmission, Prisma } from "@prisma/client";
import type {
  CodeExecutionResultDto,
  CodingProblemDto,
  DsaPattern,
  ExecutionVerdict,
  ProblemAttemptStatus,
  ProblemDifficulty,
  ProblemExample,
  ProblemTestCase,
  RunCodeInput,
  StarterCodeMap,
  TestCaseExecutionDetail,
} from "@techquery/shared";
import { prisma } from "../../core/database/index.js";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { PromptRegistry } from "../../core/ai/prompt.registry.js";
import { BadRequestError, NotFoundError } from "../../core/errors/AppError.js";
import {
  DsaProblemItemAISchema,
  type DsaProblemItemAI,
} from "../questions/question.schemas.js";
import { deterministicDsaQuestionFallback } from "../questions/question.fallback.js";
import { ensureCuratedProblemsSeeded } from "./curatedProblems.js";
import { judge0Adapter, Judge0Adapter } from "./judge0.adapter.js";
import { translateExecutionError } from "./errorTranslator.js";

export function toCodingProblemDto(row: CodingProblem): CodingProblemDto {
  const sampleTestCases = Array.isArray(row.sampleTestCases)
    ? (row.sampleTestCases as unknown as ProblemTestCase[])
    : [];
  const hiddenTestCases = Array.isArray(row.hiddenTestCases)
    ? (row.hiddenTestCases as unknown as ProblemTestCase[])
    : [];

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    difficulty: row.difficulty as ProblemDifficulty,
    pattern: row.pattern as DsaPattern,
    statement: row.statement,
    constraints: Array.isArray(row.constraints) ? (row.constraints as string[]) : [],
    examples: Array.isArray(row.examples)
      ? (row.examples as unknown as ProblemExample[])
      : [],
    starterCode: row.starterCode as unknown as StarterCodeMap,
    sampleTestCases,
    hiddenTestCaseCount: hiddenTestCases.length,
    hints: Array.isArray(row.hints) ? (row.hints as string[]) : [],
    createdAt: row.createdAt.toISOString(),
  };
}

export class CodingService {
  constructor(
    private judge0: Judge0Adapter = judge0Adapter,
    private ai: AIGateway = aiGateway
  ) {}

  public async listProblems(
    filters: {
      difficulty?: ProblemDifficulty;
      pattern?: DsaPattern;
    },
    userId?: string
  ): Promise<CodingProblemDto[]> {
    await ensureCuratedProblemsSeeded();

    const where: Prisma.CodingProblemWhereInput = {};
    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }
    if (filters.pattern && filters.pattern !== "ALL_PATTERNS") {
      where.pattern = filters.pattern;
    }

    const rows = await prisma.codingProblem.findMany({
      where,
      orderBy: [{ difficulty: "asc" }, { createdAt: "desc" }],
    });

    const seenTitles = new Set<string>();
    const uniqueRows = rows.filter((row) => {
      const key = row.title.trim().toLowerCase();
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    });

    if (!userId) {
      return uniqueRows.map(toCodingProblemDto);
    }

    const [dsaSolvedRows, submissionRows] = await Promise.all([
      prisma.userDsaSheetProgress.findMany({
        where: { userId, status: "SOLVED" },
        select: { problemSlug: true },
      }),
      prisma.codingSubmission.findMany({
        where: { userId },
        select: { problemId: true, verdict: true },
      }),
    ]);

    const solvedSlugs = new Set(dsaSolvedRows.map((r) => r.problemSlug));
    const acceptedProblemIds = new Set<string>();
    const attemptedProblemIds = new Set<string>();
    for (const sub of submissionRows) {
      attemptedProblemIds.add(sub.problemId);
      if (sub.verdict === "ACCEPTED") {
        acceptedProblemIds.add(sub.problemId);
      }
    }

    return uniqueRows.map((row) => {
      const userStatus: ProblemAttemptStatus =
        solvedSlugs.has(row.slug) || acceptedProblemIds.has(row.id)
          ? "SOLVED"
          : attemptedProblemIds.has(row.id)
            ? "ATTEMPTED"
            : "UNSOLVED";
      return {
        ...toCodingProblemDto(row),
        userStatus,
      };
    });
  }

  public async getProblemById(
    userId: string,
    id: string
  ): Promise<{
    problem: CodingProblemDto;
    submissions: Array<Omit<CodingSubmission, "createdAt"> & { createdAt: string }>;
  }> {
    await ensureCuratedProblemsSeeded();

    const row = await prisma.codingProblem.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundError("Coding problem not found", "PROBLEM_NOT_FOUND");
    }

    const [submissions, dsaProgress] = await Promise.all([
      prisma.codingSubmission.findMany({
        where: { userId, problemId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.userDsaSheetProgress.findUnique({
        where: { userId_problemSlug: { userId, problemSlug: row.slug } },
        select: { status: true },
      }),
    ]);

    const hasAccepted = submissions.some((s) => s.verdict === "ACCEPTED");
    const userStatus: ProblemAttemptStatus =
      dsaProgress?.status === "SOLVED" || hasAccepted
        ? "SOLVED"
        : submissions.length > 0
          ? "ATTEMPTED"
          : "UNSOLVED";

    return {
      problem: {
        ...toCodingProblemDto(row),
        userStatus,
      },
      submissions: submissions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  public async generateProblem(
    userId: string,
    input: { difficulty: ProblemDifficulty; pattern: DsaPattern }
  ): Promise<CodingProblemDto> {
    const prompt = PromptRegistry.buildDsaQuestionGenPrompt({
      dsaPattern: input.pattern,
      preferredLanguage: "java",
      difficulty: input.difficulty,
      count: 1,
      topicFocus: input.pattern,
    });

    let problemData: DsaProblemItemAI;
    try {
      const result = await this.ai.completeStructured<DsaProblemItemAI>(
        prompt,
        DsaProblemItemAISchema,
        {
          taskType: "QGEN",
          userId,
          rawInputText: `${input.difficulty} ${input.pattern}`,
          fallbackFn: () =>
            deterministicDsaQuestionFallback({
              dsaPattern: input.pattern,
              difficulty: input.difficulty,
              count: 3,
            }).problems[0]!,
        }
      );
      problemData = result.data;
    } catch {
      problemData = deterministicDsaQuestionFallback({
        dsaPattern: input.pattern,
        difficulty: input.difficulty,
        count: 3,
      }).problems[0]!;
    }

    const baseSlug = problemData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 120);

    const created = await prisma.codingProblem.create({
      data: {
        userId,
        title: problemData.title,
        slug: `${baseSlug || "dsa-problem"}-${randomUUID().slice(0, 8)}`,
        difficulty: problemData.difficulty,
        pattern: problemData.pattern,
        statement: problemData.statement,
        constraints: problemData.constraints as unknown as Prisma.InputJsonValue,
        examples: problemData.examples as unknown as Prisma.InputJsonValue,
        starterCode: problemData.starterCode as unknown as Prisma.InputJsonValue,
        driverCode: (problemData.driverCode ?? null) as unknown as Prisma.InputJsonValue,
        sampleTestCases: problemData.sampleTestCases.map((tc, idx) => ({
          id: `sample-${idx + 1}`,
          stdin: tc.stdin,
          expectedOutput: tc.expectedOutput,
          isSample: true,
        })) as unknown as Prisma.InputJsonValue,
        hiddenTestCases: problemData.hiddenTestCases.map((tc, idx) => ({
          id: `hidden-${idx + 1}`,
          stdin: tc.stdin,
          expectedOutput: tc.expectedOutput,
          isSample: false,
        })) as unknown as Prisma.InputJsonValue,
        hints: problemData.hints as unknown as Prisma.InputJsonValue,
      },
    });

    return toCodingProblemDto(created);
  }

  public async runCode(
    userId: string,
    input: RunCodeInput
  ): Promise<CodeExecutionResultDto> {
    const problem = await prisma.codingProblem.findUnique({
      where: { id: input.problemId },
    });
    if (!problem) {
      throw new NotFoundError("Coding problem not found", "PROBLEM_NOT_FOUND");
    }

    let revealHiddenDetails = true;
    if (input.assessmentSessionId) {
      const session = await prisma.assessmentSession.findFirst({
        where: { id: input.assessmentSessionId, userId },
      });
      if (!session) {
        throw new NotFoundError(
          "Assessment session not found",
          "ASSESSMENT_NOT_FOUND"
        );
      }
      if (session.status !== "IN_PROGRESS") {
        throw new BadRequestError(
          "Assessment session is no longer active",
          "ASSESSMENT_NOT_ACTIVE"
        );
      }
      if (
        session.mode === "TIMED" &&
        session.expiresAt &&
        session.expiresAt.getTime() <= Date.now()
      ) {
        await prisma.assessmentSession.update({
          where: { id: session.id },
          data: { status: "EXPIRED", completedAt: session.expiresAt },
        });
        throw new BadRequestError(
          "Assessment session has expired",
          "ASSESSMENT_EXPIRED"
        );
      }
      revealHiddenDetails = session.mode !== "TIMED";
    }

    const driverMap =
      problem.driverCode &&
      typeof problem.driverCode === "object" &&
      !Array.isArray(problem.driverCode)
        ? (problem.driverCode as unknown as Partial<StarterCodeMap>)
        : null;
    const executableCode = this.wrapWithDriver(
      input.language,
      input.code,
      driverMap?.[input.language]
    );

    const sampleTestCases = Array.isArray(problem.sampleTestCases)
      ? (problem.sampleTestCases as unknown as ProblemTestCase[])
      : [];
    const hiddenTestCases = Array.isArray(problem.hiddenTestCases)
      ? (problem.hiddenTestCases as unknown as ProblemTestCase[])
      : [];

    const casesToRun =
      input.mode === "SUBMIT"
        ? [...sampleTestCases, ...hiddenTestCases]
        : sampleTestCases;

    if (casesToRun.length === 0) {
      throw new BadRequestError(
        "No test cases available for this problem",
        "NO_TEST_CASES"
      );
    }

    const batchOutcome = await this.judge0.executeBatch({
      language: input.language,
      code: executableCode,
      testCases: casesToRun,
    });

    const overallVerdict = batchOutcome.verdict;
    const maxRuntimeMs = batchOutcome.runtimeMs;
    const maxMemoryKb = batchOutcome.memoryKb;

    const results: TestCaseExecutionDetail[] = batchOutcome.results.map((r) => {
      const tc = casesToRun[r.caseNumber - 1]!;
      const showDetails = tc.isSample || revealHiddenDetails;
      return {
        testCaseId: r.testCaseId,
        caseNumber: r.caseNumber,
        isHidden: r.isHidden,
        passed: r.passed,
        stdin: showDetails ? tc.stdin : "[Hidden]",
        expectedOutput: showDetails ? tc.expectedOutput : "[Hidden]",
        actualOutput: showDetails ? r.actualOutput : "[Hidden]",
        stderr: batchOutcome.stderr,
        compileOutput: batchOutcome.compileOutput,
        runtimeMs: batchOutcome.runtimeMs,
      };
    });

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = casesToRun.length;
    const friendlyMessage = translateExecutionError({
      verdict: overallVerdict,
      caseNumber: batchOutcome.firstFailingCaseNumber,
      compileOutput: batchOutcome.compileOutput,
      stderr: batchOutcome.stderr,
    });

    let submissionId: string | undefined;
    if (input.mode === "SUBMIT") {
      const submission = await prisma.codingSubmission.create({
        data: {
          userId,
          problemId: problem.id,
          assessmentSessionId: input.assessmentSessionId || null,
          language: input.language,
          code: input.code,
          verdict: overallVerdict,
          passedCount,
          totalCount,
          runtimeMs: maxRuntimeMs,
          memoryKb: maxMemoryKb,
        },
      });
      submissionId = submission.id;

      if (overallVerdict === "ACCEPTED") {
        await prisma.userDsaSheetProgress.upsert({
          where: {
            userId_problemSlug: {
              userId,
              problemSlug: problem.slug,
            },
          },
          update: { status: "SOLVED" },
          create: {
            userId,
            problemSlug: problem.slug,
            status: "SOLVED",
          },
        });
      }

      if (input.assessmentSessionId) {
        await this.updateAssessmentSlotScore(
          input.assessmentSessionId,
          problem.id,
          passedCount,
          totalCount,
          overallVerdict
        );
      }
    }

    return {
      verdict: overallVerdict,
      passedCount,
      totalCount,
      runtimeMs: maxRuntimeMs,
      memoryKb: maxMemoryKb,
      results,
      friendlyMessage,
      submissionId,
    };
  }

  private async updateAssessmentSlotScore(
    sessionId: string,
    problemId: string,
    passedCount: number,
    totalCount: number,
    verdict: ExecutionVerdict
  ): Promise<void> {
    const slot = await prisma.assessmentSessionProblem.findFirst({
      where: { sessionId, problemId },
    });
    if (!slot) return;

    const newPoints = Math.round((passedCount / Math.max(1, totalCount)) * slot.maxPoints);
    const bestPoints = Math.max(slot.earnedPoints, newPoints);
    const solved = slot.solved || verdict === "ACCEPTED";

    await prisma.assessmentSessionProblem.update({
      where: { id: slot.id },
      data: { earnedPoints: bestPoints, solved },
    });

    const allSlots = await prisma.assessmentSessionProblem.findMany({
      where: { sessionId },
      select: { earnedPoints: true },
    });
    const totalScore = allSlots.reduce((sum, s) => sum + s.earnedPoints, 0);

    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { totalScore },
    });
  }

  private wrapWithDriver(
    language: string,
    userCode: string,
    driverTemplate?: string
  ): string {
    if (!driverTemplate || !driverTemplate.includes("{{USER_CODE}}")) {
      return userCode;
    }
    const hasStandaloneEntry =
      (language === "java" && /\bpublic\s+class\s+Main\b/.test(userCode)) ||
      (language === "python" && /__name__\s*==\s*['"]__main__['"]/.test(userCode)) ||
      (language === "cpp" && /\bint\s+main\s*\(/.test(userCode)) ||
      (language === "javascript" && /fs\.readFileSync\s*\(\s*0/.test(userCode));

    if (hasStandaloneEntry) {
      return userCode;
    }
    return driverTemplate.replace("{{USER_CODE}}", userCode);
  }
}

export const codingService = new CodingService();
