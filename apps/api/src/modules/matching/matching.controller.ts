import type { Request, Response, NextFunction } from "express";
import { matchingService, MatchingService } from "./matching.service.js";
import { CreateMatchSchema, MatchIdParamSchema } from "./matching.schemas.js";
import { sendSuccess } from "../../core/responses/index.js";
import { UnauthorizedError, ValidationError } from "../../core/errors/AppError.js";

export class MatchingController {
  constructor(private service: MatchingService = matchingService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = CreateMatchSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError(parsed.error.issues[0]?.message || "Validation failed", details);
      }

      const match = await this.service.evaluateMatch(
        userId,
        parsed.data.resumeId,
        parsed.data.jdId
      );

      sendSuccess(res, { match }, 201);
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const matches = await this.service.listMatches(userId);
      sendSuccess(res, { matches }, 200);
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = MatchIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid match ID", parsed.error.issues);
      }

      const match = await this.service.getMatchById(userId, parsed.data.id);
      sendSuccess(res, { match }, 200);
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = MatchIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid match ID", parsed.error.issues);
      }

      const result = await this.service.deleteMatch(userId, parsed.data.id);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const matchingController = new MatchingController();
