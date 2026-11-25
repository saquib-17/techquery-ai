import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import {
  questionRepository,
  QuestionRepository,
  type QuestionSetWithQuestions,
  type QuestionSetSummary,
} from "./question.repository.js";
import { prisma } from "../../core/database/index.js";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { PromptRegistry } from "../../core/ai/prompt.registry.js";
import {
  deterministicQuestionFallback,
  deterministicDsaQuestionFallback,
} from "./question.fallback.js";
import {
  QuestionSetAIResponseSchema,
  DsaQuestionSetAIResponseSchema,
  type GenerateQuestionSetInput,
  type QuestionSetAIResponse,
  type DsaQuestionSetAIResponse,
  type QuestionCategory,
  type QuestionDifficulty,
} from "./question.schemas.js";
import { NotFoundError } from "../../core/errors/AppError.js";
import { logger } from "../../core/logger/index.js";
import type { Response } from "express";
import {
  pdfGeneratorService,
  type ExportQuestionItem,
} from "../../core/export/pdf-generator.service.js";
import { usageService } from "../usage/usage.service.js";
import { activityService } from "../dashboard/activity.service.js";

export class QuestionService {
  constructor(
    private repo: QuestionRepository = questionRepository,
    private ai: AIGateway = aiGateway
  ) { }

  /**
   * Generates a tailored question set using AI with deterministic fallback.
   * Enforces strict BOLA/IDOR protection on all referenced context entities.
   */
  public async generateQuestionSet(
    userId: string,
    input: GenerateQuestionSetInput
  ): Promise<QuestionSetWithQuestions> {
    // 0. Quota check (Free tier: max 5 sets/month, max 15 questions/set)
    await usageService.assertWithinQuota(userId, "questionSetsMonthly");
    await usageService.assertMaxQuestionsPerSet(userId, input.count);

    if (input.generationMode === "DSA_ALGORITHMS") {
      return this.generateDsaQuestionSet(userId, input);
    }

    let resumeText: string | undefined;
    let jdTitle: string | undefined;
    let jdCompany: string | null | undefined;
    let jdText: string | undefined;
    let matchedSkills: string[] | undefined;
    let missingSkills: Array<{ skill: string; importance: string; category?: string }> | undefined;
    const extractedSkillsSet = new Set<string>();

    // 1. Verify Resume ownership if supplied
    if (input.resumeId) {
      const resume = await prisma.resume.findFirst({
        where: { id: input.resumeId, userId },
      });
      if (!resume) {
        throw new NotFoundError("Resume not found", "RESUME_NOT_FOUND");
      }
      resumeText = resume.extractedText || undefined;

      // Extract skills from parsedData if available
      if (resume.parsedData && typeof resume.parsedData === "object") {
        const pd = resume.parsedData as any;
        if (Array.isArray(pd.skills)) {
          pd.skills.forEach((s: string) => extractedSkillsSet.add(s));
        }
      }
    }

    // 2. Verify Job Description ownership if supplied
    if (input.jdId) {
      const jd = await prisma.jobDescription.findFirst({
        where: { id: input.jdId, userId },
      });
      if (!jd) {
        throw new NotFoundError("Job description not found", "JD_NOT_FOUND");
      }
      jdTitle = jd.title;
      jdCompany = jd.company;
      jdText = jd.rawText;

      // Extract skills from structuredJson if available
      if (jd.structuredJson && typeof jd.structuredJson === "object") {
        const sj = jd.structuredJson as any;
        if (Array.isArray(sj.mustHaveSkills)) {
          sj.mustHaveSkills.forEach((s: string) => extractedSkillsSet.add(s));
        }
        if (Array.isArray(sj.niceToHaveSkills)) {
          sj.niceToHaveSkills.forEach((s: string) => extractedSkillsSet.add(s));
        }
      }
    }

    // 3. Verify Job Match ownership if supplied
    if (input.matchId) {
      const match = await prisma.jobMatch.findFirst({
        where: { id: input.matchId, userId },
        include: {
          jobDescription: true,
          resume: true,
        },
      });
      if (!match) {
        throw new NotFoundError("Match report not found", "MATCH_NOT_FOUND");
      }

      if (Array.isArray(match.matchedSkills)) {
        matchedSkills = match.matchedSkills as string[];
        matchedSkills.forEach((s) => extractedSkillsSet.add(s));
      }

      if (Array.isArray(match.missingSkills)) {
        missingSkills = match.missingSkills as Array<{
          skill: string;
          importance: string;
          category?: string;
        }>;
        missingSkills.forEach((m) => extractedSkillsSet.add(m.skill));
      }

      if (!jdTitle && match.jobDescription) {
        jdTitle = match.jobDescription.title;
        jdCompany = match.jobDescription.company;
        jdText = match.jobDescription.rawText;
      }
      if (!resumeText && match.resume) {
        resumeText = match.resume.extractedText || undefined;
      }
    }

    const aggregatedSkills = Array.from(extractedSkillsSet);

    // 4. Construct AI Prompt
    const prompt = PromptRegistry.buildQuestionGenPrompt({
      resumeText,
      jdTitle,
      jdCompany,
      jdText,
      matchedSkills,
      missingSkills,
      topicFocus: input.topicFocus,
      difficulty: input.difficulty,
      categories: input.categories,
      count: input.count,
      title: input.title,
    });

    // 5. Execute AI Generation with Fallback
    let aiResponse: QuestionSetAIResponse;
    let providerUsed = "FALLBACK";

    try {
      const result = await this.ai.completeStructured<QuestionSetAIResponse>(
        prompt,
        QuestionSetAIResponseSchema,
        {
          taskType: "QGEN",
          userId,
          rawInputText: `${resumeText || ""}\n${jdText || ""}`,
          fallbackFn: () =>
            deterministicQuestionFallback({
              skills: aggregatedSkills,
              topicFocus: input.topicFocus,
              difficulty: input.difficulty,
              categories: input.categories,
              count: input.count,
              title: input.title,
              jdTitle,
              jdCompany,
            }),
        }
      );

      aiResponse = result.data;
      providerUsed = result.providerUsed;
    } catch (err) {
      logger.warn(
        { err, userId, topicFocus: input.topicFocus },
        "AI question generation failed; applying deterministic offline fallback"
      );
      aiResponse = deterministicQuestionFallback({
        skills: aggregatedSkills,
        topicFocus: input.topicFocus,
        difficulty: input.difficulty,
        categories: input.categories,
        count: input.count,
        title: input.title,
        jdTitle,
        jdCompany,
      });
      providerUsed = "FALLBACK";
    }

    // 6. Ensure exact requested count and slice if LLM over-generated
    const questionsToSave = aiResponse.questions.slice(0, input.count);

    // If LLM returned fewer questions than requested, fill with fallback
    if (questionsToSave.length < input.count) {
      const remainingNeeded = input.count - questionsToSave.length;
      const supplemental = deterministicQuestionFallback({
        skills: aggregatedSkills,
        topicFocus: input.topicFocus,
        difficulty: input.difficulty,
        categories: input.categories,
        count: remainingNeeded,
        jdTitle,
        jdCompany,
      });
      questionsToSave.push(...supplemental.questions.slice(0, remainingNeeded));
    }

    const titleToUse =
      input.title ||
      aiResponse.title ||
      (jdTitle ? `${jdTitle} Interview Practice Set` : `${input.topicFocus} (${input.difficulty}) Practice Set`);

    // 7. Persist to Database
    const created = await this.repo.createQuestionSetWithQuestions({
      userId,
      resumeId: input.resumeId,
      jdId: input.jdId,
      matchId: input.matchId,
      title: titleToUse,
      topicFocus: input.topicFocus,
      difficulty: input.difficulty,
      providerUsed,
      questions: questionsToSave.map((q) => ({
        category: q.category as QuestionCategory,
        difficulty: q.difficulty as QuestionDifficulty,
        targetedSkill: q.targetedSkill,
        questionText: q.questionText,
        interviewerIntent: q.interviewerIntent,
        keyEvaluationPoints: q.keyEvaluationPoints,
      })),
    });

    await activityService.logActivity(userId, "QUESTIONS_GENERATED", {
      questionSetId: created.id,
      count: created.questions.length,
      topicFocus: created.topicFocus,
      difficulty: created.difficulty,
    });

    return created;
  }

  /**
   * Generates a DSA & Algorithm Pattern question set and persists linked CodingProblem records.
   */
  private async generateDsaQuestionSet(
    userId: string,
    input: GenerateQuestionSetInput
  ): Promise<QuestionSetWithQuestions> {
    const dsaPattern = input.dsaPattern || "ALL_PATTERNS";
    const preferredLanguage = input.preferredLanguage || "java";

    const prompt = PromptRegistry.buildDsaQuestionGenPrompt({
      dsaPattern,
      preferredLanguage,
      difficulty: input.difficulty,
      count: input.count,
      topicFocus: input.topicFocus,
      title: input.title,
    });

    let aiResponse: DsaQuestionSetAIResponse;
    let providerUsed = "FALLBACK";

    try {
      const result = await this.ai.completeStructured<DsaQuestionSetAIResponse>(
        prompt,
        DsaQuestionSetAIResponseSchema,
        {
          taskType: "QGEN",
          userId,
          rawInputText: `${dsaPattern} ${input.topicFocus}`,
          fallbackFn: () =>
            deterministicDsaQuestionFallback({
              dsaPattern,
              difficulty: input.difficulty,
              count: input.count,
              title: input.title,
            }),
        }
      );
      aiResponse = result.data;
      providerUsed = result.providerUsed;
    } catch (err) {
      logger.warn(
        { err, userId, dsaPattern },
        "AI DSA question generation failed; applying deterministic offline fallback"
      );
      aiResponse = deterministicDsaQuestionFallback({
        dsaPattern,
        difficulty: input.difficulty,
        count: input.count,
        title: input.title,
      });
      providerUsed = "FALLBACK";
    }

    const problemsToSave = aiResponse.problems.slice(0, input.count);
    if (problemsToSave.length < input.count) {
      const remaining = input.count - problemsToSave.length;
      const supplemental = deterministicDsaQuestionFallback({
        dsaPattern,
        difficulty: input.difficulty,
        count: remaining,
      });
      problemsToSave.push(...supplemental.problems.slice(0, remaining));
    }

    const linkedQuestions: Array<{
      category: QuestionCategory;
      difficulty: QuestionDifficulty;
      targetedSkill: string;
      questionText: string;
      interviewerIntent: string;
      keyEvaluationPoints: string[];
      codingProblemId: string;
    }> = [];

    for (const p of problemsToSave) {
      const baseSlug = p.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 120);
      const slug = `${baseSlug || "dsa-problem"}-${randomUUID().slice(0, 8)}`;

      const codingProblem = await prisma.codingProblem.create({
        data: {
          userId,
          title: p.title,
          slug,
          difficulty: p.difficulty,
          pattern: p.pattern,
          statement: p.statement,
          constraints: p.constraints as unknown as Prisma.InputJsonValue,
          examples: p.examples as unknown as Prisma.InputJsonValue,
          starterCode: p.starterCode as unknown as Prisma.InputJsonValue,
          driverCode: (p.driverCode ?? null) as unknown as Prisma.InputJsonValue,
          sampleTestCases: p.sampleTestCases.map((tc, idx) => ({
            id: `sample-${idx + 1}`,
            stdin: tc.stdin,
            expectedOutput: tc.expectedOutput,
            isSample: true,
          })) as unknown as Prisma.InputJsonValue,
          hiddenTestCases: p.hiddenTestCases.map((tc, idx) => ({
            id: `hidden-${idx + 1}`,
            stdin: tc.stdin,
            expectedOutput: tc.expectedOutput,
            isSample: false,
          })) as unknown as Prisma.InputJsonValue,
          hints: p.hints as unknown as Prisma.InputJsonValue,
        },
      });

      linkedQuestions.push({
        category: "CODING",
        difficulty: p.difficulty as QuestionDifficulty,
        targetedSkill: p.targetedSkill || p.pattern,
        questionText: `${p.title}: ${p.statement}`,
        interviewerIntent:
          p.interviewerIntent ||
          `Evaluates algorithmic problem-solving and edge-case handling for ${p.pattern}.`,
        keyEvaluationPoints:
          p.keyEvaluationPoints && p.keyEvaluationPoints.length > 0
            ? p.keyEvaluationPoints
            : [
                "Optimal time and space complexity",
                "Accurate stdin/stdout handling and edge cases",
              ],
        codingProblemId: codingProblem.id,
      });
    }

    const titleToUse =
      input.title ||
      aiResponse.title ||
      `DSA ${dsaPattern} (${input.difficulty}) Practice Set`;

    const created = await this.repo.createQuestionSetWithQuestions({
      userId,
      resumeId: input.resumeId,
      jdId: input.jdId,
      matchId: input.matchId,
      title: titleToUse,
      topicFocus: dsaPattern === "ALL_PATTERNS" ? input.topicFocus : dsaPattern,
      difficulty: input.difficulty,
      providerUsed,
      questions: linkedQuestions,
    });

    await activityService.logActivity(userId, "QUESTIONS_GENERATED", {
      questionSetId: created.id,
      count: created.questions.length,
      topicFocus: created.topicFocus,
      difficulty: created.difficulty,
      generationMode: "DSA_ALGORITHMS",
    });

    return created;
  }

  /**
   * Lists all question sets belonging to the user.
   */
  public async listQuestionSets(userId: string): Promise<QuestionSetSummary[]> {
    return this.repo.findAllByUserId(userId);
  }

  /**
   * Retrieves a question set by ID ensuring ownership (BOLA/IDOR protection).
   */
  public async getQuestionSetById(
    userId: string,
    id: string
  ): Promise<QuestionSetWithQuestions> {
    const questionSet = await this.repo.findByIdAndUserId(id, userId);
    if (!questionSet) {
      throw new NotFoundError("Question set not found", "QUESTION_SET_NOT_FOUND");
    }
    return questionSet;
  }

  /**
   * Deletes a question set by ID ensuring ownership (BOLA/IDOR protection).
   */
  public async deleteQuestionSet(
    userId: string,
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const deleted = await this.repo.deleteByIdAndUserId(id, userId);
    if (!deleted) {
      throw new NotFoundError("Question set not found", "QUESTION_SET_NOT_FOUND");
    }
    return { success: true, message: "Question set deleted successfully" };
  }

  /**
   * Exports a question set to a formatted PDF and streams to the response.
   */
  public async exportQuestionSetPdf(
    userId: string,
    id: string,
    res: Response
  ): Promise<void> {
    const questionSet = await this.getQuestionSetById(userId, id);

    const items: ExportQuestionItem[] = questionSet.questions.map((q, idx) => ({
      index: idx + 1,
      category: q.category,
      difficulty: q.difficulty,
      targetedSkill: q.targetedSkill,
      questionText: q.questionText,
      interviewerIntent: q.interviewerIntent,
      keyEvaluationPoints: Array.isArray(q.keyEvaluationPoints)
        ? (q.keyEvaluationPoints as string[])
        : [],
      answer: q.answer
        ? {
          shortSummary: q.answer.shortSummary,
          detailedExplanation: q.answer.detailedExplanation,
          codeSnippet: q.answer.codeSnippet,
          timeComplexity: q.answer.timeComplexity,
          spaceComplexity: q.answer.spaceComplexity,
          commonMistakes: Array.isArray(q.answer.commonMistakes)
            ? (q.answer.commonMistakes as string[])
            : [],
        }
        : null,
    }));

    pdfGeneratorService.streamToResponse(
      {
        title: questionSet.title,
        subtitle: `Focus: ${questionSet.topicFocus} | Difficulty: ${questionSet.difficulty}`,
        generatedAt: new Date(),
        items,
      },
      res,
      `question_set_${questionSet.title}`
    );

    await activityService.logActivity(userId, "PDF_EXPORTED", {
      exportType: "QUESTION_SET",
      questionSetId: id,
    });
  }
}

export const questionService = new QuestionService();
