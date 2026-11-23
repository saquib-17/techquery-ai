import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { Router, type Request, type Response, type NextFunction, type Application } from "express";
import { createApp } from "../../../src/app.js";
import { connectDatabase, disconnectDatabase } from "../../../src/core/database/index.js";
import { BadRequestError } from "../../../src/core/errors/AppError.js";

describe("Middleware, Security & Error Handling Integration Tests", () => {
  let app: Application;

  beforeAll(async () => {
    await connectDatabase();

    const testRouter = Router();

    // Operational error endpoint
    testRouter.get("/test/operational-error", (_req: Request, _res: Response, next: NextFunction) => {
      next(new BadRequestError("Custom validation failed"));
    });

    // Async Express 5 route error endpoint
    testRouter.get("/test/async-error", async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      throw new Error("Unhandled async failure in Express 5");
    });

    // Generic 4xx client error endpoint (e.g. 422 Unprocessable Entity)
    testRouter.get("/test/client-error", (_req: Request, _res: Response, next: NextFunction) => {
      const err: any = new Error("Unprocessable semantic entity");
      err.status = 422;
      next(err);
    });

    // Post endpoint for payload size testing
    testRouter.post("/test/json-body", (req: Request, res: Response) => {
      res.json({ receivedLength: JSON.stringify(req.body).length });
    });

    app = createApp(testRouter);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("should return standard 404 envelope for unmatched routes", async () => {
    const res = await request(app).get("/api/v1/non-existent-endpoint");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toContain("Route GET /api/v1/non-existent-endpoint not found");
  });

  it("should format operational AppErrors with appropriate status and code", async () => {
    const res = await request(app).get("/test/operational-error");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(res.body.error.message).toBe("Custom validation failed");
  });

  it("should catch async errors in Express 5 and sanitize unexpected errors", async () => {
    const res = await request(app).get("/test/async-error");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(res.body.error.message).toBe("An unexpected error occurred");
    expect(res.body.error.stack).toBeUndefined();
  });

  it("should preserve generic 4xx HTTP client status and codes", async () => {
    const res = await request(app).get("/test/client-error");

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(res.body.error.message).toBe("Unprocessable semantic entity");
  });

  it("should enforce Helmet security headers", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(
      res.headers["x-frame-options"] || res.headers["content-security-policy"]
    ).toBeDefined();
  });

  it("should accept approved CORS origin (http://localhost:5173)", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:5173");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("should reject unapproved CORS origins with HTTP 403 Forbidden", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://unapproved-origin.com");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("should accept valid JSON payload within 1MB limit", async () => {
    const validPayload = { message: "small text payload" };
    const res = await request(app)
      .post("/test/json-body")
      .send(validPayload);

    expect(res.status).toBe(200);
  });

  it("should reject JSON payload exceeding 1MB limit with HTTP 413 Payload Too Large", async () => {
    const largeString = "x".repeat(1.2 * 1024 * 1024);
    const res = await request(app)
      .post("/test/json-body")
      .send({ data: largeString });

    expect(res.status).toBe(413);
  });
});
