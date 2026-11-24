import type { Request, Response, NextFunction } from "express";
import { candidateService, CandidateService } from "./candidate.service.js";
import { createProfileSchema, updateProfileSchema, updateOnboardingSchema } from "./candidate.schemas.js";
import { sendSuccess } from "../../core/responses/index.js";
import { ValidationError, UnauthorizedError } from "../../core/errors/AppError.js";

export class CandidateController {
  constructor(private service: CandidateService = candidateService) {}

  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const profile = await this.service.getProfile(userId);
      sendSuccess(res, { profile }, 200);
    } catch (err) {
      next(err);
    }
  };

  public createProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = createProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError("Invalid profile details", details);
      }

      const profile = await this.service.createProfile(userId, parsed.data);
      sendSuccess(res, { profile }, 201);
    } catch (err) {
      next(err);
    }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError("Invalid profile update details", details);
      }

      const profile = await this.service.updateProfile(userId, parsed.data);
      sendSuccess(res, { profile }, 200);
    } catch (err) {
      next(err);
    }
  };

  public getOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const onboarding = await this.service.getOnboarding(userId);
      sendSuccess(res, { onboarding }, 200);
    } catch (err) {
      next(err);
    }
  };

  public updateOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = updateOnboardingSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError("Invalid onboarding details", details);
      }

      const onboarding = await this.service.updateOnboarding(userId, parsed.data);
      sendSuccess(res, { onboarding }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const candidateController = new CandidateController();
