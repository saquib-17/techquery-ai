import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  SaveAssessmentDraftInputSchema,
  StartAssessmentInputSchema,
} from "@techquery/shared";
import { UnauthorizedError, ValidationError } from "../../core/errors/AppError.js";
import { sendSuccess } from "../../core/responses/index.js";
import { assessmentService, AssessmentService } from "./assessment.service.js";

const SessionIdParamSchema = z.object({
  id: z.string().uuid("Invalid assessment session ID"),
});

export class AssessmentController {
  constructor(private service: AssessmentService = assessmentService) {}

  public getActive = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const session = await this.service.getActiveSession(userId);
      sendSuccess(res, { session }, 200);
    } catch (err) {
      next(err);
    }
  };

  public start = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = StartAssessmentInputSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.issues[0]?.message || "Invalid session configuration",
          parsed.error.issues
        );
      }

      const session = await this.service.startSession(userId, parsed.data);
      sendSuccess(res, { session }, 201);
    } catch (err) {
      next(err);
    }
  };

  public history = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const sessions = await this.service.getHistory(userId);
      sendSuccess(res, { sessions }, 200);
    } catch (err) {
      next(err);
    }
  };

  public getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = SessionIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid session ID", parsed.error.issues);
      }

      const session = await this.service.getSessionById(userId, parsed.data.id);
      sendSuccess(res, { session }, 200);
    } catch (err) {
      next(err);
    }
  };

  public saveDraft = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const paramParsed = SessionIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new ValidationError("Invalid session ID", paramParsed.error.issues);
      }

      const bodyParsed = SaveAssessmentDraftInputSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new ValidationError(
          bodyParsed.error.issues[0]?.message || "Invalid draft payload",
          bodyParsed.error.issues
        );
      }

      const session = await this.service.saveDraft(
        userId,
        paramParsed.data.id,
        bodyParsed.data
      );
      sendSuccess(res, { session }, 200);
    } catch (err) {
      next(err);
    }
  };

  public finish = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = SessionIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid session ID", parsed.error.issues);
      }

      const session = await this.service.finishSession(userId, parsed.data.id);
      sendSuccess(res, { session }, 200);
    } catch (err) {
      next(err);
    }
  };

  public cancel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = SessionIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid session ID", parsed.error.issues);
      }

      const session = await this.service.cancelSession(userId, parsed.data.id);
      sendSuccess(res, { session }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const assessmentController = new AssessmentController();
