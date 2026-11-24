import { prisma } from "../../core/database/index.js";
import type { QuestionSet, Question, Answer, Prisma } from "@prisma/client";
import type { QuestionDifficulty, QuestionCategory } from "./question.schemas.js";

export type QuestionSetWithQuestions = QuestionSet & {
  questions: (Question & { answer?: Answer | null })[];
};

export type QuestionSetSummary = Omit<QuestionSet, "updatedAt"> & {
  updatedAt: Date;
};

export class QuestionRepository {
  /**
   * Atomically creates a QuestionSet along with all its nested Question items.
   */
  public async createQuestionSetWithQuestions(data: {
    userId: string;
    resumeId?: string | null;
    jdId?: string | null;
    matchId?: string | null;
    title: string;
    topicFocus: string;
    difficulty: QuestionDifficulty;
    providerUsed: string;
    questions: Array<{
      category: QuestionCategory;
      difficulty: QuestionDifficulty;
      targetedSkill: string;
      questionText: string;
      interviewerIntent: string;
      keyEvaluationPoints: string[];
    }>;
  }): Promise<QuestionSetWithQuestions> {
    return prisma.questionSet.create({
      data: {
        userId: data.userId,
        resumeId: data.resumeId || null,
        jdId: data.jdId || null,
        matchId: data.matchId || null,
        title: data.title,
        topicFocus: data.topicFocus,
        difficulty: data.difficulty,
        totalCount: data.questions.length,
        providerUsed: data.providerUsed,
        questions: {
          create: data.questions.map((q) => ({
            category: q.category,
            difficulty: q.difficulty,
            targetedSkill: q.targetedSkill,
            questionText: q.questionText,
            interviewerIntent: q.interviewerIntent,
            keyEvaluationPoints: q.keyEvaluationPoints as unknown as Prisma.InputJsonValue,
          })),
        },
      },
      include: {
        questions: true,
      },
    });
  }

  /**
   * Retrieves all question sets for a user ordered by newest first (summary projection).
   */
  public async findAllByUserId(userId: string): Promise<QuestionSetSummary[]> {
    return prisma.questionSet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        resumeId: true,
        jdId: true,
        matchId: true,
        title: true,
        topicFocus: true,
        difficulty: true,
        totalCount: true,
        providerUsed: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Retrieves a single question set by ID ensuring ownership (BOLA/IDOR protection).
   */
  public async findByIdAndUserId(
    id: string,
    userId: string
  ): Promise<QuestionSetWithQuestions | null> {
    return prisma.questionSet.findFirst({
      where: { id, userId },
      include: {
        questions: {
          orderBy: { createdAt: "asc" },
          include: {
            answer: true,
          },
        },
      },
    });
  }

  /**
   * Deletes a question set by ID ensuring ownership (BOLA/IDOR protection).
   * Cascades deletion to all child questions.
   */
  public async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.questionSet.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.questionSet.delete({
      where: { id },
    });

    return true;
  }
}

export const questionRepository = new QuestionRepository();
