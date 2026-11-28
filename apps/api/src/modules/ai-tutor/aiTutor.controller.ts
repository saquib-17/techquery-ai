import type { Request, Response, NextFunction } from "express";
import { AiTutorChatInputSchema } from "@techquery/shared";
import {
  UnauthorizedError,
  ValidationError,
} from "../../core/errors/AppError.js";
import { sendSuccess } from "../../core/responses/index.js";
import { aiTutorService, AiTutorService } from "./aiTutor.service.js";

export class AiTutorController {
  constructor(private service: AiTutorService = aiTutorService) {}

  public chat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = AiTutorChatInputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.issues[0]?.message || "Invalid AI Tutor chat payload",
          parsed.error.issues
        );
      }

      const result = await this.service.chat(userId, parsed.data);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const aiTutorController = new AiTutorController();
