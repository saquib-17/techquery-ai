import type { Request, Response, NextFunction } from "express";
import {
  jobDescriptionService,
  JobDescriptionService,
} from "./job-description.service.js";
import {
  CreateJobDescriptionSchema,
  JdIdParamSchema,
} from "./job-description.schemas.js";
import { sendSuccess } from "../../core/responses/index.js";
import { UnauthorizedError, ValidationError } from "../../core/errors/AppError.js";

export class JobDescriptionController {
  constructor(private service: JobDescriptionService = jobDescriptionService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = CreateJobDescriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError(parsed.error.issues[0]?.message || "Validation failed", details);
      }

      const jobDescription = await this.service.createJobDescription(userId, parsed.data);
      sendSuccess(res, { jobDescription }, 201);
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const jobDescriptions = await this.service.listJobDescriptions(userId);
      sendSuccess(res, { jobDescriptions }, 200);
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = JdIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid job description ID", parsed.error.issues);
      }

      const jobDescription = await this.service.getJobDescriptionById(userId, parsed.data.id);
      sendSuccess(res, { jobDescription }, 200);
    } catch (err) {
      next(err);
    }
  };

  public reanalyze = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = JdIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid job description ID", parsed.error.issues);
      }

      const jobDescription = await this.service.reanalyzeJobDescription(userId, parsed.data.id);
      sendSuccess(res, { jobDescription }, 200);
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = JdIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid job description ID", parsed.error.issues);
      }

      const result = await this.service.deleteJobDescription(userId, parsed.data.id);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const jobDescriptionController = new JobDescriptionController();
