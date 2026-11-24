import { prisma } from "../../core/database/index.js";
import type { Answer, Question, QuestionSet, Resume, JobDescription, Prisma } from "@prisma/client";
import type { AnswerStyle } from "./answer.schemas.js";

export type QuestionWithFullContext = Question & {
  questionSet: QuestionSet & {
    resume: Resume | null;
    jobDescription: JobDescription | null;
  };
  answer: Answer | null;
};

export class AnswerRepository {
  /**
   * Fetches a Question including its parent QuestionSet (with optional Resume and JobDescription)
   * and existing Answer, strictly verifying that the QuestionSet belongs to the specified userId.
   * Returns null if not found or unauthorized (BOLA/IDOR protection).
   */
  public async findOwnedQuestionWithContext(
    questionId: string,
    userId: string
  ): Promise<QuestionWithFullContext | null> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        questionSet: {
          include: {
            resume: true,
            jobDescription: true,
          },
        },
        answer: true,
      },
    });

    if (!question || question.questionSet.userId !== userId) {
      return null;
    }

    return question as QuestionWithFullContext;
  }

  /**
   * Atomically upserts an Answer for a given questionId.
   */
  public async upsertAnswer(data: {
    questionId: string;
    shortSummary: string;
    detailedExplanation: string;
    codeSnippet: string | null;
    timeComplexity: string | null;
    spaceComplexity: string | null;
    commonMistakes: string[];
    style: AnswerStyle;
    providerUsed: string;
  }): Promise<Answer> {
    return prisma.answer.upsert({
      where: { questionId: data.questionId },
      create: {
        questionId: data.questionId,
        shortSummary: data.shortSummary,
        detailedExplanation: data.detailedExplanation,
        codeSnippet: data.codeSnippet,
        timeComplexity: data.timeComplexity,
        spaceComplexity: data.spaceComplexity,
        commonMistakes: data.commonMistakes as unknown as Prisma.InputJsonValue,
        style: data.style,
        providerUsed: data.providerUsed,
      },
      update: {
        shortSummary: data.shortSummary,
        detailedExplanation: data.detailedExplanation,
        codeSnippet: data.codeSnippet,
        timeComplexity: data.timeComplexity,
        spaceComplexity: data.spaceComplexity,
        commonMistakes: data.commonMistakes as unknown as Prisma.InputJsonValue,
        style: data.style,
        providerUsed: data.providerUsed,
      },
    });
  }

  /**
   * Retrieves an Answer by questionId, ensuring ownership through question.questionSet.userId.
   */
  public async findAnswerByQuestionIdAndUserId(
    questionId: string,
    userId: string
  ): Promise<Answer | null> {
    const answer = await prisma.answer.findUnique({
      where: { questionId },
      include: {
        question: {
          include: {
            questionSet: true,
          },
        },
      },
    });

    if (!answer || answer.question.questionSet.userId !== userId) {
      return null;
    }

    return answer;
  }

  /**
   * Deletes an Answer by questionId, ensuring ownership through question.questionSet.userId.
   * Returns true if deleted, false if not found or unauthorized.
   */
  public async deleteAnswerByQuestionIdAndUserId(
    questionId: string,
    userId: string
  ): Promise<boolean> {
    const existing = await this.findAnswerByQuestionIdAndUserId(questionId, userId);
    if (!existing) {
      return false;
    }

    await prisma.answer.delete({
      where: { id: existing.id },
    });

    return true;
  }
}

export const answerRepository = new AnswerRepository();
