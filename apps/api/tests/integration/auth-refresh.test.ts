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

  it("5. concurrent refresh with same token: exactly one succeeds or race triggers reuse detection revoking family", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    const user = await prisma.user.create({
      data: {
        name: "Concurrent Refresh User",
        email: "concurrent.refresh@example.com",
        passwordHash,
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
    });

    const rawToken = TokenUtils.generateSecureToken();
    const tokenHash = TokenUtils.hashToken(rawToken);
    const familyId = "concurrent-family-test";

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
      },
    });

    // Fire two simultaneous refresh requests with the exact same token
    const [res1, res2] = await Promise.all([
      request(app).post("/api/v1/auth/refresh").set("Cookie", [`refreshToken=${rawToken}`]),
      request(app).post("/api/v1/auth/refresh").set("Cookie", [`refreshToken=${rawToken}`]),
    ]);

    const statuses = [res1.status, res2.status].sort();

    // Case A: Request 1 succeeds (200), Request 2 runs after rotation and hits reuse detection (401)
    // Case B: Both detect race condition (one rotates, second triggers family revocation 401)
    // Under all conditions, NEVER can both return 200!
    expect(statuses[0]).toBe(200);
    expect(statuses[1]).toBe(401);

    const successfulRes = res1.status === 200 ? res1 : res2;
    const failingRes = res1.status === 401 ? res1 : res2;

    expect(successfulRes.body.success).toBe(true);
    expect(failingRes.body.success).toBe(false);
    expect(["TOKEN_REUSE_DETECTED", "INVALID_REFRESH_TOKEN"]).toContain(failingRes.body.error.code);

    // Old token must be revoked
    const oldRecord = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    expect(oldRecord?.isRevoked).toBe(true);
  });

  it("6. rejects newly issued token if the family was revoked due to old token reuse replay", async () => {
    const passwordHash = await PasswordService.hashPassword("ValidPassword123!");
    const user = await prisma.user.create({
      data: {
        name: "Replay Attack User",
        email: "replay.attack@example.com",
        passwordHash,
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
    });

    // 1. Initial token T1
    const rawT1 = TokenUtils.generateSecureToken();
    const hashT1 = TokenUtils.hashToken(rawT1);
    const familyId = "replay-family-test";

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashT1,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
      },
    });

    // 2. Legitimate rotation: T1 -> T2
    const rotateRes = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`refreshToken=${rawT1}`]);

    expect(rotateRes.status).toBe(200);

    const setCookie = rotateRes.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
    const rawT2Match = cookieStr.match(/refreshToken=([^;]+)/);
    expect(rawT2Match).not.toBeNull();
    const rawT2 = rawT2Match![1];

    // 3. Attacker replays T1 (the old consumed token)
    const replayRes = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`refreshToken=${rawT1}`]);

    expect(replayRes.status).toBe(401);
    expect(replayRes.body.error.code).toBe("TOKEN_REUSE_DETECTED");

    // 4. Legitimate user now tries to use T2 (the newly issued token) -> MUST BE REJECTED because entire family was revoked!
    const t2Res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`refreshToken=${rawT2}`]);

    expect(t2Res.status).toBe(401);
    expect(t2Res.body.error.code).toBe("TOKEN_REUSE_DETECTED");

    // Verify all tokens in this family are revoked in DB
    const familyTokens = await prisma.refreshToken.findMany({ where: { familyId } });
    expect(familyTokens.length).toBeGreaterThanOrEqual(2);
    expect(familyTokens.every((t) => t.isRevoked)).toBe(true);
  });
});
