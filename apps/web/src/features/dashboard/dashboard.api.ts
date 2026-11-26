import { api } from "@/lib/api";

export type ActivityType =
  | "RESUME_UPLOADED"
  | "JD_ANALYZED"
  | "MATCH_EVALUATED"
  | "QUESTIONS_GENERATED"
  | "ANSWER_GENERATED"
  | "COLLECTION_CREATED"
  | "PDF_EXPORTED"
  | "TIER_CHANGED";

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

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActiveDate: string | null;
  activityMatrix: Array<{ date: string; count: number }>;
}

export interface UserActivityItem {
  id: string;
  userId: string;
  activityType: ActivityType;
  activityDate: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ResourceQuotaStatus {
  used: number;
  limit: number | null;
  remaining: number | null;
  isUnlimited: boolean;
}

export interface UserQuotasResponse {
  tier: "FREE" | "PRO";
  quotas: {
    resumes: ResourceQuotaStatus;
    jobDescriptions: ResourceQuotaStatus;
    questionSetsMonthly: ResourceQuotaStatus;
    answersMonthly: ResourceQuotaStatus;
  };
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

export interface DashboardSummary {
  metrics: DashboardMetrics;
  dsaMastery?: DsaMasterySummary;
  csAndHrMastery?: CsAndHrMasterySummary;
  roadmapProgress?: RoadmapProgressSummary;
  completedOaSessions?: number;
  streak: StreakResult;
  recentActivities: UserActivityItem[];
  usage: UserQuotasResponse;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getDashboardSummaryApi(): Promise<DashboardSummary> {
  const res = await api.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary");
  return res.data.data;
}
