import { usageRepository, type UsageRepository } from "./usage.repository.js";
import { QUOTA_LIMITS, type QuotaLimit } from "./quota.config.js";
import { TooManyRequestsError, NotFoundError } from "../../core/errors/AppError.js";
import type { UserTier } from "@prisma/client";

export interface ResourceQuotaStatus {
  used: number;
  limit: number | null;
  remaining: number | null;
  isUnlimited: boolean;
}

export interface UserQuotasResponse {
  tier: UserTier;
  quotas: {
    resumes: ResourceQuotaStatus;
    jobDescriptions: ResourceQuotaStatus;
    questionSetsMonthly: ResourceQuotaStatus;
    answersMonthly: ResourceQuotaStatus;
  };
}

export type QuotaResource = "resumes" | "jobDescriptions" | "questionSetsMonthly" | "answersMonthly";

export class UsageService {
  constructor(private readonly repository: UsageRepository = usageRepository) {}

  /**
   * Calculates the start of the current calendar month in UTC (1st of month at 00:00:00.000Z).
   */
  public getStartOfCurrentMonthUTC(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  }

  /**
   * Retrieves comprehensive quota consumption and limits for a candidate.
   */
  public async getUserQuotas(userId: string): Promise<UserQuotasResponse> {
    const tier = await this.repository.getUserTier(userId);
    if (!tier) {
      throw new NotFoundError("User not found");
    }

    const limits: QuotaLimit = QUOTA_LIMITS[tier];
    const startOfMonth = this.getStartOfCurrentMonthUTC();

    const [resumesUsed, jdsUsed, questionSetsUsed, answersUsed] = await Promise.all([
      this.repository.countUserResumes(userId),
      this.repository.countUserJobDescriptions(userId),
      this.repository.countUserQuestionSetsMonthly(userId, startOfMonth),
      this.repository.countUserAnswersMonthly(userId, startOfMonth),
    ]);

    const buildStatus = (used: number, limit: number | null): ResourceQuotaStatus => {
      if (limit === null) {
        return {
          used,
          limit: null,
          remaining: null,
          isUnlimited: true,
        };
      }
      return {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        isUnlimited: false,
      };
    };

    return {
      tier,
      quotas: {
        resumes: buildStatus(resumesUsed, limits.resumes),
        jobDescriptions: buildStatus(jdsUsed, limits.jobDescriptions),
        questionSetsMonthly: buildStatus(questionSetsUsed, limits.questionSetsMonthly),
        answersMonthly: buildStatus(answersUsed, limits.answersMonthly),
      },
    };
  }

  /**
   * Asserts that a user has not exceeded their plan limit for a specific resource.
   * Throws HTTP 429 TooManyRequestsError (code: QUOTA_EXCEEDED) if the limit is exceeded.
   */
  public async assertWithinQuota(userId: string, resource: QuotaResource): Promise<void> {
    const tier = await this.repository.getUserTier(userId);
    if (!tier) {
      throw new NotFoundError("User not found");
    }

    const limits: QuotaLimit = QUOTA_LIMITS[tier];
    const limit = limits[resource];

    // If resource is unlimited on user's tier, allow immediately
    if (limit === null) {
      return;
    }

    const startOfMonth = this.getStartOfCurrentMonthUTC();
    let currentUsage = 0;

    switch (resource) {
      case "resumes":
        currentUsage = await this.repository.countUserResumes(userId);
        break;
      case "jobDescriptions":
        currentUsage = await this.repository.countUserJobDescriptions(userId);
        break;
      case "questionSetsMonthly":
        currentUsage = await this.repository.countUserQuestionSetsMonthly(userId, startOfMonth);
        break;
      case "answersMonthly":
        currentUsage = await this.repository.countUserAnswersMonthly(userId, startOfMonth);
        break;
    }

    if (currentUsage >= limit) {
      const resourceLabels: Record<QuotaResource, string> = {
        resumes: "resumes",
        jobDescriptions: "saved job descriptions",
        questionSetsMonthly: "monthly question sets",
        answersMonthly: "monthly model answers",
      };

      throw new TooManyRequestsError(
        `You have reached the maximum allowed ${resourceLabels[resource]} (${limit}) for the ${tier} tier. Upgrade to PRO to increase your quota limits.`,
        "QUOTA_EXCEEDED"
      );
    }
  }

  /**
   * Validates that requested question count does not exceed tier's max questions per set.
   */
  public async assertMaxQuestionsPerSet(userId: string, count: number): Promise<void> {
    const tier = await this.repository.getUserTier(userId);
    if (!tier) {
      throw new NotFoundError("User not found");
    }

    const limits: QuotaLimit = QUOTA_LIMITS[tier];
    if (count > limits.maxQuestionsPerSet) {
      throw new TooManyRequestsError(
        `Question set size (${count}) exceeds the maximum allowed (${limits.maxQuestionsPerSet}) for the ${tier} tier. Upgrade to PRO for larger sets.`,
        "QUOTA_EXCEEDED"
      );
    }
  }

  /**
   * Updates user tier (1-click simulated upgrade/downgrade for placement demonstration).
   */
  public async updateUserTier(userId: string, newTier: UserTier): Promise<UserQuotasResponse> {
    const existingTier = await this.repository.getUserTier(userId);
    if (!existingTier) {
      throw new NotFoundError("User not found");
    }

    await this.repository.updateUserTier(userId, newTier);
    return this.getUserQuotas(userId);
  }
}

export const usageService = new UsageService();
