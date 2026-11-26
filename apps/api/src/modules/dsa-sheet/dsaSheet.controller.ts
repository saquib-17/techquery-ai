import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  SupportedCodeLanguageSchema,
  UpdateDsaSheetProgressSchema,
} from "@techquery/shared";
import { UnauthorizedError, ValidationError } from "../../core/errors/AppError.js";
import { sendSuccess } from "../../core/responses/index.js";
import { dsaSheetService, DsaSheetService } from "./dsaSheet.service.js";

const ProblemSlugParamSchema = z.object({
  problemSlug: z.string().min(1).max(180),
});

const WalkthroughBodySchema = z.object({
  language: SupportedCodeLanguageSchema.default("java"),
});

export class DsaSheetController {
  constructor(private service: DsaSheetService = dsaSheetService) {}

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

      const paramParsed = ProblemSlugParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new ValidationError("Invalid problem slug", paramParsed.error.issues);
      }

      const bodyParsed = UpdateDsaSheetProgressSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new ValidationError(
          bodyParsed.error.issues[0]?.message || "Invalid progress payload",
          bodyParsed.error.issues
        );
      }

      const progress = await this.service.updateProgress(
        userId,
        paramParsed.data.problemSlug,
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

      const paramParsed = ProblemSlugParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new ValidationError("Invalid problem slug", paramParsed.error.issues);
      }

      const bodyParsed = WalkthroughBodySchema.safeParse(req.body ?? {});
      if (!bodyParsed.success) {
        throw new ValidationError("Invalid language", bodyParsed.error.issues);
      }

      const walkthrough = await this.service.generateWalkthrough(
        userId,
        paramParsed.data.problemSlug,
        bodyParsed.data.language
      );
      sendSuccess(res, { walkthrough }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const dsaSheetController = new DsaSheetController();
