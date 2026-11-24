import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError, NotFoundError } from "./AppError.js";
import { sendError } from "../responses/index.js";
import { logger } from "../logger/index.js";
import { config } from "../config/index.js";

/**
 * 404 Not Found Handler for unmatched routes.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};

/**
 * Centralized Error Handling Middleware.
 * Catches all errors, logs them safely with Pino, and formats standard JSON responses.
 * Preserves 4xx status codes for client errors (such as 413 Payload Too Large from body-parser).
 * Sanitizes all unexpected 5xx internal errors to prevent leaking database or server details.
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const isAppError = err instanceof AppError;
  const httpStatus = (err as any).statusCode || (err as any).status;

  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred";

  if (isAppError && err.isOperational) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if ((err as any).name === "MulterError" || (err as any).code === "LIMIT_FILE_SIZE") {
    if ((err as any).code === "LIMIT_FILE_SIZE") {
      statusCode = 413;
      code = "FILE_TOO_LARGE";
      message = "File exceeds the 5MB upload limit";
    } else {
      statusCode = 400;
      code = (err as any).code || "INVALID_FILE_UPLOAD";
      message = err.message || "File upload validation failed";
    }
  } else if ((err as any).name === "ZodError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = (err as any).issues?.[0]?.message || "Validation failed";
  } else if ((err as any).type === "entity.too.large" || httpStatus === 413) {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request payload exceeds the 1MB size limit";
  } else if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
    statusCode = httpStatus;
    code = "BAD_REQUEST";
    message = err.message || "Bad request syntax or format";
  }

  const details = (err as any).details;

  // Structured logging (redacting any credentials via Pino's pre-configured REDACTED_PATHS)
  logger.error(
    {
      err: {
        message: err.message,
        stack: config.NODE_ENV === "development" ? err.stack : undefined,
        code,
        statusCode,
        details,
      },
      req: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      },
    },
    `Request error: ${err.message}`
  );

  sendError(res, statusCode, code, message, details);
};
