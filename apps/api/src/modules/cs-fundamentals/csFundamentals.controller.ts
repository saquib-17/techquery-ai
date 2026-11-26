import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UpdateCsProgressSchema } from "@techquery/shared";
import { UnauthorizedError, ValidationError } from "../../core/errors/AppError.js";
import { sendSuccess } from "../../core/responses/index.js";
import {
  csFundamentalsService,
  CsFundamentalsService,
} from "./csFundamentals.service.js";

const TopicSlugParamSchema = z.object({
  topicSlug: z.string().min(1).max(180),
});

export class CsFundamentalsController {
  constructor(private service: CsFundamentalsService = csFundamentalsService) {}

  public getSheet = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const data = await this.service.getSheetForUser(userId);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };

  public updateProgress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const paramParsed = TopicSlugParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new ValidationError("Invalid topic slug", paramParsed.error.issues);
      }

      const bodyParsed = UpdateCsProgressSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new ValidationError(
          bodyParsed.error.issues[0]?.message || "Invalid progress payload",
          bodyParsed.error.issues
        );
      }

      const progress = await this.service.updateProgress(
        userId,
        paramParsed.data.topicSlug,
        bodyParsed.data
      );
      sendSuccess(res, { progress }, 200);
    } catch (err) {
      next(err);
    }
  };

  public generateWalkthrough = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const paramParsed = TopicSlugParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new ValidationError("Invalid topic slug", paramParsed.error.issues);
      }

      const walkthrough = await this.service.generateWalkthrough(
        userId,
        paramParsed.data.topicSlug
      );
      sendSuccess(res, { walkthrough }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const csFundamentalsController = new CsFundamentalsController();
