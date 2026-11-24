import type { Request, Response, NextFunction } from "express";
import { answerService, AnswerService } from "./answer.service.js";
import {
  GenerateAnswerSchema,
  QuestionIdParamSchema,
} from "./answer.schemas.js";
import { sendSuccess } from "../../core/responses/index.js";
import { UnauthorizedError, ValidationError } from "../../core/errors/AppError.js";

export class AnswerController {
  constructor(private service: AnswerService = answerService) {}

  public generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = GenerateAnswerSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError(parsed.error.issues[0]?.message || "Validation failed", details);
      }

      const result = await this.service.generateAnswer(userId, parsed.data);
      const statusCode = result.isCached || result.isUpdated ? 200 : 201;

      sendSuccess(res, { answer: result.answer }, statusCode);
    } catch (err) {
      next(err);
    }
  };

  public getByQuestionId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = QuestionIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid question ID", parsed.error.issues);
      }

      const answer = await this.service.getAnswerByQuestionId(userId, parsed.data.questionId);

      sendSuccess(res, { answer }, 200);
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = QuestionIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid question ID", parsed.error.issues);
      }

      const result = await this.service.deleteAnswerByQuestionId(
        userId,
        parsed.data.questionId
      );

      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const answerController = new AnswerController();

