import type { Request, Response, NextFunction } from "express";
import { questionService, QuestionService } from "./question.service.js";
import {
  GenerateQuestionSetSchema,
  QuestionSetIdParamSchema,
} from "./question.schemas.js";
import { sendSuccess } from "../../core/responses/index.js";
import { UnauthorizedError, ValidationError } from "../../core/errors/AppError.js";

export class QuestionController {
  constructor(private service: QuestionService = questionService) {}

  public generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = GenerateQuestionSetSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError(parsed.error.issues[0]?.message || "Validation failed", details);
      }

      const questionSet = await this.service.generateQuestionSet(userId, parsed.data);
      sendSuccess(res, { questionSet }, 201);
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const questionSets = await this.service.listQuestionSets(userId);
      sendSuccess(res, { questionSets }, 200);
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = QuestionSetIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid question set ID", parsed.error.issues);
      }

      const questionSet = await this.service.getQuestionSetById(userId, parsed.data.id);
      sendSuccess(res, { questionSet }, 200);
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = QuestionSetIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid question set ID", parsed.error.issues);
      }

      const result = await this.service.deleteQuestionSet(userId, parsed.data.id);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  public exportPdf = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = QuestionSetIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid question set ID", parsed.error.issues);
      }

      await this.service.exportQuestionSetPdf(userId, parsed.data.id, res);
    } catch (err) {
      next(err);
    }
  };
}

export const questionController = new QuestionController();
