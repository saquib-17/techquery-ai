import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { config } from "../../src/core/config/index.js";
import { PasswordService } from "../../src/core/security/password.service.js";
import { TokenUtils } from "../../src/core/security/token.service.js";

describe("CSRF & Cookie Protection Integration Tests", () => {
  const app = createApp();

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();
  });

  it("1. allows refresh request when Origin matches FRONTEND_URL", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    const user = await prisma.user.create({
      data: {
        name: "CSRF User",
        email: "csrf.user@example.com",
        passwordHash,
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
    });

    const rawToken = TokenUtils.generateSecureToken();
    const tokenHash = TokenUtils.hashToken(rawToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId: "csrf-family-1",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Origin", config.FRONTEND_URL)
      .set("Cookie", [`refreshToken=${rawToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("2. allows refresh request when Referer matches FRONTEND_URL and Origin is absent", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    const user = await prisma.user.create({
      data: {
        name: "CSRF User 2",
        email: "csrf.user2@example.com",
        passwordHash,
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
    });

    const rawToken = TokenUtils.generateSecureToken();
    const tokenHash = TokenUtils.hashToken(rawToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId: "csrf-family-2",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Referer", `${config.FRONTEND_URL}/dashboard`)
      .set("Cookie", [`refreshToken=${rawToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("3. rejects refresh request when Origin is an untrusted/malicious origin with 403 Forbidden", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Origin", "http://malicious-site.com")
      .set("Cookie", ["refreshToken=fake_token"]);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("Origin http://malicious-site.com is not allowed by CORS");
  });

  it("4. rejects logout request from malicious origin with 403 Forbidden", async () => {
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Origin", "http://attacker-site.com")
      .set("Cookie", ["refreshToken=fake_token"]);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("Origin http://attacker-site.com is not allowed by CORS");
  });

  it("5. rejects refresh request when Referer is from an untrusted origin with 403 Forbidden", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Referer", "http://evil-site.com/exploit")
      .set("Cookie", ["refreshToken=fake_token"]);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(["CSRF_REFERER_INVALID", "CSRF_REFERER_MALFORMED"]).toContain(res.body.error.code);
  });
});
