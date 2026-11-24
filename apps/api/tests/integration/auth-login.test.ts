import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { PasswordService } from "../../src/core/security/password.service.js";

describe("POST /api/v1/auth/login Integration Tests", () => {
  const app = createApp();

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();
  });

  it("1. logs in verified user successfully with 200, access token in body, and refresh cookie", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    await prisma.user.create({
      data: {
        name: "Verified User",
        email: "verified@example.com",
        passwordHash,
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "verified@example.com",
        password: "ValidPassword123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe("verified@example.com");
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();

    // Check refresh cookie
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieHeader = Array.isArray(cookies) ? cookies.join(";") : cookies;
    expect(cookieHeader).toContain("refreshToken=");
    expect(cookieHeader).toContain("HttpOnly");
    expect(cookieHeader).toContain("Path=/api/v1/auth");

    // Check DB refresh token record
    const tokens = await prisma.refreshToken.findMany();
    expect(tokens.length).toBe(1);
    expect(tokens[0].isRevoked).toBe(false);
  });

  it("2. rejects unverified user with 401 Unauthorized", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    await prisma.user.create({
      data: {
        name: "Unverified User",
        email: "unverified@example.com",
        passwordHash,
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: false,
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "unverified@example.com",
        password: "ValidPassword123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("Please verify your email address");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("3. rejects invalid password with 401 Unauthorized", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    await prisma.user.create({
      data: {
        name: "User One",
        email: "user@example.com",
        passwordHash,
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "user@example.com",
        password: "WrongPassword!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe("Invalid email or password");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("4. rejects non-existent user with generic 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "nobody@example.com",
        password: "ValidPassword123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("5. validates request body fields with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "not-an-email",
        password: "",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("6. rejects unknown extraneous fields in login payload", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "user@example.com",
        password: "ValidPassword123!",
        extraField: "hack",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("7. enforces sliding-window login rate limiting after 5 failed attempts", async () => {
    const email = "rate.limit@example.com";

    // Attempt 1 to 5 with wrong password
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email,
          password: "WrongPassword123!",
        });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    }

    // 6th attempt must be rejected by rate limiter
    const throttledRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email,
        password: "WrongPassword123!",
      });

    expect(throttledRes.status).toBe(401);
    expect(throttledRes.body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(throttledRes.body.error.message).toContain("Too many login attempts");
  });
});
