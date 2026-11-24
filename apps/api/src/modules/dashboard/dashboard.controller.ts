import type { Request, Response, NextFunction } from "express";
import { dashboardService, type DashboardService } from "./dashboard.service.js";
import { sendSuccess } from "../../core/responses/index.js";

export class DashboardController {
  constructor(private readonly service: DashboardService = dashboardService) {}

  public getSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const data = await this.service.getDashboardSummary(userId);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const dashboardController = new DashboardController();
