import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { PasswordService } from "../../src/core/security/password.service.js";
import { TokenUtils } from "../../src/core/security/token.service.js";
import { JwtService } from "../../src/core/security/jwt.service.js";

describe("POST /api/v1/auth/logout & logout-all Integration Tests", () => {
  const app = createApp();

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();
  });

  it("1. logs out by revoking current refresh token and clearing cookie", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    const user = await prisma.user.create({
      data: {
        name: "Logout User",
        email: "logout@example.com",
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
        familyId: "family-logout",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [`refreshToken=${rawToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify token is revoked in DB
    const tokenRecord = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    expect(tokenRecord?.isRevoked).toBe(true);

    // Verify clear cookie header
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieHeader = Array.isArray(cookies) ? cookies.join(";") : cookies;
    expect(cookieHeader).toContain("refreshToken=;");
  });

  it("2. logout-all revokes all user active refresh tokens across families", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    const user = await prisma.user.create({
      data: {
        name: "LogoutAll User",
        email: "logoutall@example.com",
        passwordHash,
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
    });

    // Create two distinct token families for this user
    const token1 = TokenUtils.generateSecureToken();
    const token2 = TokenUtils.generateSecureToken();

    await prisma.refreshToken.createMany({
      data: [
        {
          userId: user.id,
          tokenHash: TokenUtils.hashToken(token1),
          familyId: "device-1",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isRevoked: false,
        },
        {
          userId: user.id,
          tokenHash: TokenUtils.hashToken(token2),
          familyId: "device-2",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isRevoked: false,
        },
      ],
    });

    const accessToken = JwtService.signAccessToken({
      userId: user.id,
      role: user.role,
      tier: user.tier,
    });

    const res = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify all tokens for this user are now revoked
    const activeTokens = await prisma.refreshToken.findMany({
      where: { userId: user.id, isRevoked: false },
    });
    expect(activeTokens.length).toBe(0);
  });

  it("3. logout-all rejects unauthenticated requests with 401", async () => {
    const res = await request(app).post("/api/v1/auth/logout-all");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
