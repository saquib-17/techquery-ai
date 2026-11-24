import { prisma } from "../../core/database/index.js";
import type { ActivityType, UserActivity } from "@prisma/client";

export class ActivityRepository {
  public async create(
    userId: string,
    activityType: ActivityType,
    activityDate: Date,
    metadata: Record<string, unknown> = {}
  ): Promise<UserActivity> {
    return prisma.userActivity.create({
      data: {
        userId,
        activityType,
        activityDate,
        metadata: metadata as any,
      },
    });
  }

  public async findRecent(userId: string, limit = 10): Promise<UserActivity[]> {
    return prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  public async findAllDates(userId: string): Promise<Date[]> {
    const records = await prisma.userActivity.findMany({
      where: { userId },
      select: { activityDate: true },
      orderBy: { activityDate: "asc" },
    });
    return records.map((r) => r.activityDate);
  }
}

export const activityRepository = new ActivityRepository();
