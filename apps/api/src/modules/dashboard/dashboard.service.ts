import {
  CS_FUNDAMENTALS_TOPICS,
  DSA_SHEET_PROBLEMS,
  RoadmapPhaseSchema,
} from "@techquery/shared";
import { z } from "zod";
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

export interface DsaMasterySummary {
  solvedCount: number;
  revisionCount: number;
  totalProblems: number;
  nextProblem: {
    slug: string;
    title: string;
    pattern: string;
    difficulty: string;
  } | null;
}

export interface CsAndHrMasterySummary {
  learnedCount: number;
  revisionCount: number;
  totalTopics: number;
  nextTopic: {
    slug: string;
    title: string;
    subject: string;
  } | null;
}

export interface RoadmapProgressSummary {
  activeRoadmapId: string | null;
  activeRoadmapTitle: string | null;
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  nextTask: {
    title: string;
    weekLabel: string;
  } | null;
}

export interface DashboardSummaryResponse {
  metrics: DashboardMetrics;
  dsaMastery: DsaMasterySummary;
  csAndHrMastery: CsAndHrMasterySummary;
  roadmapProgress: RoadmapProgressSummary;
  completedOaSessions: number;
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
      dsaRows,
      csRows,
      completedOaSessions,
      oaSessions,
      codingSubmissions,
      latestRoadmap,
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
      prisma.userDsaSheetProgress.findMany({
        where: { userId },
        select: { problemSlug: true, status: true, updatedAt: true },
      }),
      prisma.userCsProgress.findMany({
        where: { userId },
        select: { topicSlug: true, status: true, updatedAt: true },
      }),
      prisma.assessmentSession.count({
        where: { userId, status: "COMPLETED" },
      }),
      prisma.assessmentSession.findMany({
        where: { userId },
        select: { startedAt: true },
      }),
      prisma.codingSubmission.findMany({
        where: { userId },
        select: { createdAt: true },
      }),
      prisma.learningRoadmap.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const rawAvg = matchAgg._avg?.matchScore;
    const averageMatchScore =
      rawAvg !== null && rawAvg !== undefined
        ? Math.round(rawAvg * 10) / 10
        : null;

    // DSA Mastery + Next Unsolved Problem
    const dsaStatusMap = new Map(
      dsaRows.map((r) => [r.problemSlug, r.status])
    );
    let dsaSolved = 0;
    let dsaRevision = 0;
    for (const r of dsaRows) {
      if (r.status === "SOLVED") dsaSolved += 1;
      if (r.status === "REVISION") dsaRevision += 1;
    }
    const nextDsa =
      DSA_SHEET_PROBLEMS.find((p) => dsaStatusMap.get(p.slug) !== "SOLVED") ??
      null;

    // CS, SD & HR Mastery + Next Unstudied Topic
    const csStatusMap = new Map(csRows.map((r) => [r.topicSlug, r.status]));
    let csLearned = 0;
    let csRevision = 0;
    for (const r of csRows) {
      if (r.status === "LEARNED") csLearned += 1;
      if (r.status === "REVISION") csRevision += 1;
    }
    const nextCs =
      CS_FUNDAMENTALS_TOPICS.find(
        (t) => csStatusMap.get(t.slug) !== "LEARNED"
      ) ?? null;

    // Active Roadmap Progress + Next Incomplete Task
    let roadmapCompleted = 0;
    let roadmapTotal = 0;
    let nextRoadmapTask: { title: string; weekLabel: string } | null = null;
    if (latestRoadmap) {
      const parsedPhases = z
        .array(RoadmapPhaseSchema)
        .safeParse(latestRoadmap.phases);
      if (parsedPhases.success) {
        for (const phase of parsedPhases.data) {
          for (const task of phase.tasks) {
            roadmapTotal += 1;
            if (task.completed) {
              roadmapCompleted += 1;
            } else if (!nextRoadmapTask) {
              nextRoadmapTask = {
                title: task.title,
                weekLabel: phase.weekLabel,
              };
            }
          }
        }
      }
    }
    const roadmapPct =
      roadmapTotal > 0
        ? Math.round((roadmapCompleted / roadmapTotal) * 100)
        : 0;

    // Unified 30-day activity dates across all platform modules
    const unifiedDates: Date[] = [
      ...allActivityDates,
      ...dsaRows.map((r) => r.updatedAt),
      ...csRows.map((r) => r.updatedAt),
      ...oaSessions.map((s) => s.startedAt),
      ...codingSubmissions.map((s) => s.createdAt),
      ...(latestRoadmap ? [latestRoadmap.updatedAt] : []),
    ];

    const streak = calculatePreparationStreak(unifiedDates);

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
      dsaMastery: {
        solvedCount: dsaSolved,
        revisionCount: dsaRevision,
        totalProblems: DSA_SHEET_PROBLEMS.length,
        nextProblem: nextDsa
          ? {
              slug: nextDsa.slug,
              title: nextDsa.title,
              pattern: nextDsa.subPattern,
              difficulty: nextDsa.difficulty,
            }
          : null,
      },
      csAndHrMastery: {
        learnedCount: csLearned,
        revisionCount: csRevision,
        totalTopics: CS_FUNDAMENTALS_TOPICS.length,
        nextTopic: nextCs
          ? {
              slug: nextCs.slug,
              title: nextCs.title,
              subject: nextCs.subject,
            }
          : null,
      },
      roadmapProgress: {
        activeRoadmapId: latestRoadmap?.id ?? null,
        activeRoadmapTitle: latestRoadmap?.title ?? null,
        completedTasks: roadmapCompleted,
        totalTasks: roadmapTotal,
        percentage: roadmapPct,
        nextTask: nextRoadmapTask,
      },
      completedOaSessions,
      streak,
      recentActivities,
      usage: userQuotas,
    };
  }
}

export const dashboardService = new DashboardService();
