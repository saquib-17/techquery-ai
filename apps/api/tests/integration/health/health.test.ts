import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../../src/app.js";
import { connectDatabase, disconnectDatabase, prisma } from "../../../src/core/database/index.js";
import { assertTestDatabase } from "../../helpers/test-db.js";
import type { Application } from "express";

describe("Health & Readiness HTTP Integration Tests", () => {
  let app: Application;

  beforeAll(async () => {
    await connectDatabase();
    await assertTestDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("GET /health should return HTTP 200 with ok liveness payload", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.service).toBe("techquery-api");
  });

  it("GET /api/v1/health should return HTTP 200 on mounted API path", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  it("GET /health/ready should return HTTP 200 when PostgreSQL is available", async () => {
    const res = await request(app).get("/health/ready");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ready");
    expect(res.body.data.database).toBe("connected");
  });

  it("GET /health/ready should return HTTP 503 when database connectivity fails", async () => {
    // Mock prisma.$queryRaw failure to simulate database outage
    const originalQueryRaw = prisma.$queryRaw;
    (prisma as any).$queryRaw = async () => {
      throw new Error("Simulated connection timeout: 127.0.0.1:5432");
    };

    try {
      const res = await request(app).get("/health/ready");

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");
      expect(res.body.error.message).toBe("Database is not reachable");
      expect(JSON.stringify(res.body)).not.toContain("5432");
    } finally {
      prisma.$queryRaw = originalQueryRaw;
    }
  });
});
