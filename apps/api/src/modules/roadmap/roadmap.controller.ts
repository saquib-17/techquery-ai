import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  GenerateRoadmapSchema,
  ToggleRoadmapTaskSchema,
} from "@techquery/shared";
import { UnauthorizedError, ValidationError } from "../../core/errors/AppError.js";
import { sendSuccess } from "../../core/responses/index.js";
import { roadmapService, RoadmapService } from "./roadmap.service.js";

const RoadmapIdParamSchema = z.object({
  roadmapId: z.string().uuid(),
});

export class RoadmapController {
  constructor(private service: RoadmapService = roadmapService) {}

  public listRoadmaps = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const roadmaps = await this.service.listRoadmaps(userId);
      sendSuccess(res, { roadmaps }, 200);
    } catch (err) {
      next(err);
    }
  };

  public generateRoadmap = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = GenerateRoadmapSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.issues[0]?.message || "Invalid roadmap configuration",
          parsed.error.issues
        );
      }

      const roadmap = await this.service.generateRoadmap(userId, parsed.data);
      sendSuccess(res, { roadmap }, 201);
    } catch (err) {
      next(err);
    }
  };

  public toggleTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const paramParsed = RoadmapIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new ValidationError("Invalid roadmap ID", paramParsed.error.issues);
      }

      const bodyParsed = ToggleRoadmapTaskSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new ValidationError(
          bodyParsed.error.issues[0]?.message || "Invalid task toggle payload",
          bodyParsed.error.issues
        );
      }

      const roadmap = await this.service.toggleTask(
        userId,
        paramParsed.data.roadmapId,
        bodyParsed.data
      );
      sendSuccess(res, { roadmap }, 200);
    } catch (err) {
      next(err);
    }
  };

  public deleteRoadmap = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const paramParsed = RoadmapIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new ValidationError("Invalid roadmap ID", paramParsed.error.issues);
      }

      const result = await this.service.deleteRoadmap(
        userId,
        paramParsed.data.roadmapId
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const roadmapController = new RoadmapController();
