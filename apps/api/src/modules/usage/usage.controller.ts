import type { Request, Response, NextFunction } from "express";
import { usageService, type UsageService } from "./usage.service.js";
import { UpdateTierSchema } from "./usage.schemas.js";
import { sendSuccess } from "../../core/responses/index.js";
import { activityService } from "../dashboard/activity.service.js";
import { ValidationError, UnauthorizedError } from "../../core/errors/AppError.js";

export class UsageController {
  constructor(private readonly service: UsageService = usageService) {}

  public getQuotas = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const data = await this.service.getUserQuotas(userId);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };

  public updateTier = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = UpdateTierSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError(
          parsed.error.issues[0]?.message || "Validation failed",
          details
        );
      }

      const { tier } = parsed.data;

      const data = await this.service.updateUserTier(userId, tier);

      // Log non-critical activity
      await activityService.logActivity(userId, "TIER_CHANGED", {
        newTier: tier,
      });

      sendSuccess(
        res,
        {
          tier: data.tier,
          message: `Tier updated to ${tier} successfully`,
          quotas: data.quotas,
        },
        200
      );
    } catch (err) {
      next(err);
    }
  };
}

export const usageController = new UsageController();
