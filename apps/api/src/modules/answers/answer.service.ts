import {
  answerRepository,
  AnswerRepository,
} from "./answer.repository.js";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { PromptRegistry } from "../../core/ai/prompt.registry.js";
import { deterministicAnswerFallback } from "./answer.fallback.js";
import {
  AnswerAIResponseSchema,
  type GenerateAnswerInput,
  type AnswerAIResponse,
} from "./answer.schemas.js";
import { NotFoundError } from "../../core/errors/AppError.js";
import { logger } from "../../core/logger/index.js";
import type { Answer } from "@prisma/client";
import { usageService } from "../usage/usage.service.js";
import { activityService } from "../dashboard/activity.service.js";

export interface GenerateAnswerResult {
  answer: Answer;
  isCached: boolean;
  isUpdated: boolean;
}

export class AnswerService {
  constructor(
    private repo: AnswerRepository = answerRepository,
    private ai: AIGateway = aiGateway
  ) {}

  /**
   * Generates or retrieves a model answer for a question.
   * Enforces strict BOLA/IDOR protection by confirming question ownership via its parent QuestionSet.
   */
  public async generateAnswer(
    userId: string,
    input: GenerateAnswerInput
  ): Promise<GenerateAnswerResult> {
    // 1. Fetch Question and verify ownership
    const questionContext = await this.repo.findOwnedQuestionWithContext(
      input.questionId,
      userId
    );

    if (!questionContext) {
      throw new NotFoundError(
        "Question not found or you do not have permission to access it",
        "QUESTION_NOT_FOUND"
      );
    }

    // 2. Check if a cached answer already exists with matching style and no regenerate flag
    if (
      questionContext.answer &&
      !input.regenerate &&
      questionContext.answer.style === input.style
    ) {
      logger.info(
        { questionId: input.questionId, answerId: questionContext.answer.id },
        "Returning cached model answer"
      );
      return {
        answer: questionContext.answer,
        isCached: true,
        isUpdated: false,
      };
    }

    // 2b. Quota check for generating a new or customized answer (Free: max 20/mo, Pro: unlimited)
    await usageService.assertWithinQuota(userId, "answersMonthly");

    const isUpdated = Boolean(questionContext.answer);

    // 3. Prepare AI prompt & fallback parameters
    const keyEvalPoints = Array.isArray(questionContext.keyEvaluationPoints)
      ? (questionContext.keyEvaluationPoints as string[])
      : [];

    const resumeText =
      questionContext.questionSet.resume?.extractedText || undefined;
    const jdTitle =
      questionContext.questionSet.jobDescription?.title || undefined;
    const jdCompany =
      questionContext.questionSet.jobDescription?.company || undefined;
    const jdText =
      questionContext.questionSet.jobDescription?.rawText || undefined;

    const prompt = PromptRegistry.buildAnswerGenPrompt({
      questionText: questionContext.questionText,
      category: questionContext.category,
      difficulty: questionContext.difficulty,
      targetedSkill: questionContext.targetedSkill,
      interviewerIntent: questionContext.interviewerIntent,
      keyEvaluationPoints: keyEvalPoints,
      style: input.style,
      resumeText,
      jdTitle,
      jdCompany,
      jdText,
    });

    const isBehavioral =
      questionContext.category === "BEHAVIORAL" ||
      questionContext.category === "PROJECT_DEFENSE";

    // 4. Request completion through Centralized AI Gateway
    const aiResult = await this.ai.completeStructured<AnswerAIResponse>(
      prompt,
      AnswerAIResponseSchema,
      {
        taskType: "AGEN",
        userId,
        fallbackFn: () =>
          deterministicAnswerFallback({
            questionText: questionContext.questionText,
            category: questionContext.category,
            difficulty: questionContext.difficulty,
            targetedSkill: questionContext.targetedSkill,
            interviewerIntent: questionContext.interviewerIntent,
            keyEvaluationPoints: keyEvalPoints,
            style: input.style,
            resumeText,
            jdTitle,
            jdCompany,
          }),
      }
    );

    // 5. Enforce behavioral normalization
    const codeSnippet = isBehavioral ? null : aiResult.data.codeSnippet;
    const timeComplexity = isBehavioral ? null : aiResult.data.timeComplexity;
    const spaceComplexity = isBehavioral ? null : aiResult.data.spaceComplexity;

    // 6. Upsert the generated answer
    const savedAnswer = await this.repo.upsertAnswer({
      questionId: input.questionId,
      shortSummary: aiResult.data.shortSummary,
      detailedExplanation: aiResult.data.detailedExplanation,
      codeSnippet,
      timeComplexity,
      spaceComplexity,
      commonMistakes: aiResult.data.commonMistakes,
      style: input.style,
      providerUsed: aiResult.providerUsed,
    });

    logger.info(
      {
        questionId: input.questionId,
        answerId: savedAnswer.id,
        providerUsed: aiResult.providerUsed,
        isUpdated,
      },
      "Model answer generated and persisted successfully"
    );

    await activityService.logActivity(userId, "ANSWER_GENERATED", {
      answerId: savedAnswer.id,
      questionId: input.questionId,
      style: input.style,
    });

    return {
      answer: savedAnswer,
      isCached: false,
      isUpdated,
    };
  }

  /**
   * Retrieves an answer for a question with strict BOLA/IDOR protection.
   */
  public async getAnswerByQuestionId(
    userId: string,
    questionId: string
  ): Promise<Answer> {
    const answer = await this.repo.findAnswerByQuestionIdAndUserId(
      questionId,
      userId
    );

    if (!answer) {
      throw new NotFoundError(
        "Model answer not found for this question",
        "ANSWER_NOT_FOUND"
      );
    }

    return answer;
  }

  /**
   * Deletes an answer for a question with strict BOLA/IDOR protection.
   */
  public async deleteAnswerByQuestionId(
    userId: string,
    questionId: string
  ): Promise<{ success: boolean; message: string }> {
    const deleted = await this.repo.deleteAnswerByQuestionIdAndUserId(
      questionId,
      userId
    );

    if (!deleted) {
      throw new NotFoundError(
        "Model answer not found for this question",
        "ANSWER_NOT_FOUND"
      );
    }

    return {
      success: true,
      message: "Model answer deleted successfully",
    };
  }
}

export const answerService = new AnswerService();
