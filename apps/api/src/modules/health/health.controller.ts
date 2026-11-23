import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../core/database/index.js";
import { sendSuccess } from "../../core/responses/index.js";
import { ServiceUnavailableError } from "../../core/errors/AppError.js";

/**
 * Health & Readiness Controller
 */

export const getLiveness = (_req: Request, res: Response): void => {
  sendSuccess(res, {
    status: "ok",
    service: "techquery-api",
  });
};

export const getReadiness = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Lightweight database connectivity verification query
    await prisma.$queryRaw`SELECT 1 as ping`;

    sendSuccess(res, {
      status: "ready",
      database: "connected",
    });
  } catch (err) {
    // Pass to centralized error handler as 503 Service Unavailable without exposing DB errors
    next(new ServiceUnavailableError("Database is not reachable"));
  }
};
