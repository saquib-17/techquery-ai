import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { requireAuth, requireRole } from "../../src/core/middleware/auth.middleware.js";
import { errorHandler } from "../../src/core/errors/errorHandler.js";
import { JwtService } from "../../src/core/security/jwt.service.js";

describe("Auth & RBAC Middleware Integration Tests", () => {
  const app = express();
  app.use(express.json());

  // Test endpoints
  app.get("/api/v1/protected", requireAuth, (req, res) => {
    res.json({ success: true, user: req.user });
  });

  app.get("/api/v1/admin-only", requireAuth, requireRole("ADMIN"), (req, res) => {
    res.json({ success: true, message: "Welcome Admin" });
  });

  app.use(errorHandler);

  it("1. allows access when valid Bearer token is provided", async () => {
    const token = JwtService.signAccessToken({
      userId: "user-123",
      role: "CANDIDATE",
      tier: "FREE",
    });

    const res = await request(app)
      .get("/api/v1/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.userId).toBe("user-123");
    expect(res.body.user.role).toBe("CANDIDATE");
  });

  it("2. rejects request when Authorization header is missing with 401", async () => {
    const res = await request(app).get("/api/v1/protected");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("AUTH_HEADER_MISSING");
  });

  it("3. rejects request with malformed Authorization header with 401", async () => {
    const res = await request(app)
      .get("/api/v1/protected")
      .set("Authorization", "InvalidHeaderFormat");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("AUTH_HEADER_MALFORMED");
  });

  it("4. allows ADMIN user to access admin-only endpoint", async () => {
    const adminToken = JwtService.signAccessToken({
      userId: "admin-123",
      role: "ADMIN",
      tier: "PRO",
    });

    const res = await request(app)
      .get("/api/v1/admin-only")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Welcome Admin");
  });

  it("5. rejects CANDIDATE user from admin-only endpoint with 403 Forbidden", async () => {
    const candidateToken = JwtService.signAccessToken({
      userId: "cand-123",
      role: "CANDIDATE",
      tier: "FREE",
    });

    const res = await request(app)
      .get("/api/v1/admin-only")
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
  });
});
