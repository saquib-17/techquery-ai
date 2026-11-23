import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  BadRequestError,
  ServiceUnavailableError,
  UnauthorizedError,
  ForbiddenError,
} from "../../../src/core/errors/AppError.js";

describe("AppError Hierarchy Unit Tests", () => {
  it("should instantiate generic AppError with custom status and code", () => {
    const error = new AppError("Custom failure message", 418, "TEAPOT", true);

    expect(error.message).toBe("Custom failure message");
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe("TEAPOT");
    expect(error.isOperational).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it("should correctly configure NotFoundError", () => {
    const error = new NotFoundError("User not found");

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("User not found");
    expect(error.isOperational).toBe(true);
  });

  it("should correctly configure BadRequestError", () => {
    const error = new BadRequestError("Invalid parameter");

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.message).toBe("Invalid parameter");
    expect(error.isOperational).toBe(true);
  });

  it("should correctly configure ServiceUnavailableError", () => {
    const error = new ServiceUnavailableError("Database unreachable");

    expect(error.statusCode).toBe(503);
    expect(error.code).toBe("SERVICE_UNAVAILABLE");
    expect(error.message).toBe("Database unreachable");
    expect(error.isOperational).toBe(true);
  });

  it("should correctly configure UnauthorizedError", () => {
    const error = new UnauthorizedError();

    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.message).toBe("Authentication required");
    expect(error.isOperational).toBe(true);
  });

  it("should correctly configure ForbiddenError", () => {
    const error = new ForbiddenError("Denied");

    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.message).toBe("Denied");
    expect(error.isOperational).toBe(true);
  });
});
