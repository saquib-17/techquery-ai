import { prisma } from "../../core/database/index.js";
import { activityService, type ActivityService } from "./activity.service.js";
import { calculatePreparationStreak, type StreakResult } from "./streak.calculator.js";
import { usageService, type UsageService, type UserQuotasResponse } from "../usage/usage.service.js";
import type { UserActivity } from "@prisma/client";

export interface DashboardMetrics {
  resumesCount: number;
  jobDescriptionsCount: number;
  jobMatchesCount: number;
  averageMatchScore: number | null;
  questionSetsCount: number;
  questionsCount: number;
  answersCount: number;
  collectionsCount: number;
  bookmarkedQuestionsCount: number;
}

export interface DashboardSummaryResponse {
  metrics: DashboardMetrics;
  streak: StreakResult;
  recentActivities: UserActivity[];
  usage: UserQuotasResponse;
}

export class DashboardService {
  constructor(
    private readonly activity: ActivityService = activityService,
    private readonly usage: UsageService = usageService
  ) {}

  public async getDashboardSummary(userId: string): Promise<DashboardSummaryResponse> {
    const [
      resumesCount,
      jobDescriptionsCount,
      jobMatchesCount,
      matchAgg,
      questionSetsCount,
      questionsCount,
      answersCount,
      collectionsCount,
      bookmarkedQuestionsCount,
      allActivityDates,
      recentActivities,
      userQuotas,
    ] = await Promise.all([
      prisma.resume.count({ where: { userId } }),
      prisma.jobDescription.count({ where: { userId } }),
      prisma.jobMatch.count({ where: { resume: { userId } } }),
      prisma.jobMatch.aggregate({
        _avg: { matchScore: true },
        where: { resume: { userId } },
      }),
      prisma.questionSet.count({ where: { userId } }),
      prisma.question.count({ where: { questionSet: { userId } } }),
      prisma.answer.count({
        where: { question: { questionSet: { userId } } },
      }),
      prisma.savedCollection.count({ where: { userId } }),
      prisma.collectionItem.count({
        where: { collection: { userId } },
      }),
      this.activity.getAllActivityDates(userId),
      this.activity.getRecentActivities(userId, 10),
      this.usage.getUserQuotas(userId),
    ]);

    const rawAvg = matchAgg._avg?.matchScore;
    const averageMatchScore =
      rawAvg !== null && rawAvg !== undefined
        ? Math.round(rawAvg * 10) / 10
        : null;

    const streak = calculatePreparationStreak(allActivityDates);

    return {
      metrics: {
        resumesCount,
        jobDescriptionsCount,
        jobMatchesCount,
        averageMatchScore,
        questionSetsCount,
        questionsCount,
        answersCount,
        collectionsCount,
        bookmarkedQuestionsCount,
      },
      streak,
      recentActivities,
      usage: userQuotas,
    };
  }
}

export const dashboardService = new DashboardService();
