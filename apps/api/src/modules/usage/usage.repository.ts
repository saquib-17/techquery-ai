import { prisma } from "../../core/database/index.js";
import type { User, UserTier } from "@prisma/client";

export class UsageRepository {
  public async getUserTier(userId: string): Promise<UserTier | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true },
    });
    return user ? user.tier : null;
  }

  public async updateUserTier(userId: string, tier: UserTier): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { tier },
    });
  }

  public async countUserResumes(userId: string): Promise<number> {
    return prisma.resume.count({
      where: { userId },
    });
  }

  public async countUserJobDescriptions(userId: string): Promise<number> {
    return prisma.jobDescription.count({
      where: { userId },
    });
  }

  public async countUserQuestionSetsMonthly(userId: string, since: Date): Promise<number> {
    return prisma.questionSet.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    });
  }

  public async countUserAnswersMonthly(userId: string, since: Date): Promise<number> {
    return prisma.answer.count({
      where: {
        question: {
          questionSet: {
            userId,
          },
        },
        createdAt: { gte: since },
      },
    });
  }
}

export const usageRepository = new UsageRepository();
