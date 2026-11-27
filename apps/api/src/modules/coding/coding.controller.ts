import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  DsaPatternSchema,
  ProblemDifficultySchema,
  RunCodeInputSchema,
} from "@techquery/shared";
import { UnauthorizedError, ValidationError } from "../../core/errors/AppError.js";
import { sendSuccess } from "../../core/responses/index.js";
import { codingService, CodingService } from "./coding.service.js";

const ListProblemsQuerySchema = z.object({
  difficulty: ProblemDifficultySchema.optional(),
  pattern: DsaPatternSchema.optional(),
});

const ProblemIdParamSchema = z.object({
  id: z.string().uuid("Invalid coding problem ID"),
});

const GenerateProblemBodySchema = z.object({
  difficulty: ProblemDifficultySchema.default("MEDIUM"),
  pattern: DsaPatternSchema.default("ALL_PATTERNS"),
});

export class CodingController {
  constructor(private service: CodingService = codingService) {}

  public listProblems = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = ListProblemsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError("Invalid query parameters", parsed.error.issues);
      }

      const problems = await this.service.listProblems(parsed.data, userId);
      sendSuccess(res, { problems }, 200);
    } catch (err) {
      next(err);
    }
  };

  public getProblemById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = ProblemIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid problem ID", parsed.error.issues);
      }

      const data = await this.service.getProblemById(userId, parsed.data.id);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };

  public generateProblem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = GenerateProblemBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new ValidationError("Invalid generation parameters", parsed.error.issues);
      }

      const problem = await this.service.generateProblem(userId, parsed.data);
      sendSuccess(res, { problem }, 201);
    } catch (err) {
      next(err);
    }
  };

  public runCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = RunCodeInputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.issues[0]?.message || "Invalid code execution payload",
          parsed.error.issues
        );
      }

      const result = await this.service.runCode(userId, parsed.data);
      sendSuccess(res, { result }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const codingController = new CodingController();
