import { activityRepository, type ActivityRepository } from "./activity.repository.js";
import { logger } from "../../core/logger/index.js";
import type { ActivityType, UserActivity } from "@prisma/client";

export class ActivityService {
  constructor(private readonly repository: ActivityRepository = activityRepository) {}

  /**
   * Records an activity event for a user.
   * ActivityDate is normalized to UTC midnight.
   * Safe execution: catches and logs any errors so secondary activity tracking
   * never fails primary business transactions.
   */
  public async logActivity(
    userId: string,
    activityType: ActivityType,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const now = new Date();
      const activityDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
      );

      await this.repository.create(userId, activityType, activityDate, metadata);
    } catch (err) {
      logger.warn({ err, userId, activityType }, "Failed to log candidate activity event");
    }
  }

  public async getRecentActivities(userId: string, limit = 10): Promise<UserActivity[]> {
    return this.repository.findRecent(userId, limit);
  }

  public async getAllActivityDates(userId: string): Promise<Date[]> {
    return this.repository.findAllDates(userId);
  }
}

export const activityService = new ActivityService();
