/**
 * Core Application Error hierarchy.
 * Distinguishes operational (expected) domain errors from programmer/internal bugs.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, code, true);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST") {
    super(message, 400, code, true);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable", code = "SERVICE_UNAVAILABLE") {
    super(message, 503, code, true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", code = "UNAUTHORIZED") {
    super(message, 401, code, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden", code = "FORBIDDEN") {
    super(message, 403, code, true);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict with existing resource", code = "CONFLICT") {
    super(message, 409, code, true);
  }
}

export class ValidationError extends AppError {
  public readonly details: unknown;

  constructor(message = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", true);
    this.details = details;
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super(message, 429, "RATE_LIMIT_EXCEEDED", true);
  }
}
