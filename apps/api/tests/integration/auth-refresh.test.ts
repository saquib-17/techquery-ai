import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { PasswordService } from "../../src/core/security/password.service.js";
import { TokenUtils } from "../../src/core/security/token.service.js";
import { JwtService } from "../../src/core/security/jwt.service.js";

describe("POST /api/v1/auth/refresh & Token Rotation Integration Tests", () => {
  const app = createApp();

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();
  });

  it("1. successfully rotates refresh token and returns new access token", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    const user = await prisma.user.create({
      data: {
        name: "Refresh User",
        email: "refresh@example.com",
        passwordHash,
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
    });

    // Create an initial active refresh token
    const rawToken = TokenUtils.generateSecureToken();
    const tokenHash = TokenUtils.hashToken(rawToken);
    const familyId = "family-123";

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`refreshToken=${rawToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    // Verify claims of the new access token
    const claims = JwtService.verifyAccessToken(res.body.data.accessToken);
    expect(claims.sub).toBe(user.id);

    // Verify new refresh token in cookie
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieHeader = Array.isArray(cookies) ? cookies.join(";") : cookies;
    expect(cookieHeader).toContain("refreshToken=");

    // Verify DB state: old token is now isRevoked=true, new token exists with same familyId
    const tokens = await prisma.refreshToken.findMany({ where: { familyId } });
    expect(tokens.length).toBe(2);

    const oldToken = tokens.find((t) => t.tokenHash === tokenHash);
    expect(oldToken?.isRevoked).toBe(true);

    const activeToken = tokens.find((t) => !t.isRevoked);
    expect(activeToken).toBeDefined();
    expect(activeToken?.familyId).toBe(familyId);
  });

  it("2. detects reuse of already rotated refresh token and invalidates entire family", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    const user = await prisma.user.create({
      data: {
        name: "Reuse User",
        email: "reuse@example.com",
        passwordHash,
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
    });

    const familyId = "family-reuse-test";

    // Create token 1 (revoked, already used)
    const rawToken1 = TokenUtils.generateSecureToken();
    const hash1 = TokenUtils.hashToken(rawToken1);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hash1,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: true, // already consumed/revoked
      },
    });

    // Create token 2 (currently active in the same family)
    const rawToken2 = TokenUtils.generateSecureToken();
    const hash2 = TokenUtils.hashToken(rawToken2);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hash2,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
      },
    });

    // An attacker or compromised client replays rawToken1
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`refreshToken=${rawToken1}`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("TOKEN_REUSE_DETECTED");

    // ENTIRE FAMILY MUST BE REVOKED! Token 2 must now be revoked too
    const activeTokens = await prisma.refreshToken.findMany({
      where: { familyId, isRevoked: false },
    });
    expect(activeTokens.length).toBe(0);

    const token2 = await prisma.refreshToken.findUnique({ where: { tokenHash: hash2 } });
    expect(token2?.isRevoked).toBe(true);
  });

  it("3. rejects expired refresh token with 401", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    const user = await prisma.user.create({
      data: {
        name: "Expired User",
        email: "expired@example.com",
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
        familyId: "family-expired",
        expiresAt: new Date(Date.now() - 1000), // expired in past
        isRevoked: false,
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`refreshToken=${rawToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("REFRESH_TOKEN_EXPIRED");
  });

  it("4. rejects request with no refresh token provided", async () => {
    const res = await request(app).post("/api/v1/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
