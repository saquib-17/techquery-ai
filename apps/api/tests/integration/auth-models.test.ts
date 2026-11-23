import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { PasswordService } from "../../src/core/security/password.service.js";

describe("Database Authentication Models Integration Tests", () => {
  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();
  });

  it("1. creates User with Argon2id hash and verifies default attributes", async () => {
    const rawPassword = "CandidatePassword123!";
    const passwordHash = await PasswordService.hashPassword(rawPassword);

    const user = await prisma.user.create({
      data: {
        email: "candidate.test@example.com",
        name: "Test Candidate",
        passwordHash,
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe("candidate.test@example.com");
    expect(user.name).toBe("Test Candidate");
    expect(user.role).toBe("CANDIDATE");
    expect(user.tier).toBe("FREE");
    expect(user.isVerified).toBe(false);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect(user.passwordHash).toBe(passwordHash);

    // Verify password verification works against saved database record
    const isValid = await PasswordService.verifyPassword(rawPassword, user.passwordHash);
    expect(isValid).toBe(true);
  });

  it("2. enforces that passwordHash is strictly required on User", async () => {
    await expect(
      prisma.user.create({
        data: {
          email: "missing.password@example.com",
          name: "No Password User",
          // @ts-expect-error passwordHash is required
          passwordHash: null,
        },
      })
    ).rejects.toThrow();
  });

  it("2. enforces unique email constraint on User model", async () => {
    await prisma.user.create({
      data: {
        email: "duplicate.candidate@example.com",
        name: "First User",
        passwordHash: await PasswordService.hashPassword("Password123!"),
      },
    });

    await expect(
      prisma.user.create({
        data: {
          email: "duplicate.candidate@example.com",
          name: "Second User",
          passwordHash: await PasswordService.hashPassword("Password123!"),
        },
      })
    ).rejects.toThrow();
  });

  it("3. creates RefreshToken linked to User and enforces cascade delete", async () => {
    const user = await prisma.user.create({
      data: {
        email: "token.holder@example.com",
        name: "Token User",
        passwordHash: await PasswordService.hashPassword("Password123!"),
      },
    });

    const tokenHash = "sha256_mock_hash_abc1234567890";
    const familyId = "fam_uuid_12345";
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        expiresAt,
      },
    });

    expect(refreshToken.id).toBeDefined();
    expect(refreshToken.userId).toBe(user.id);
    expect(refreshToken.tokenHash).toBe(tokenHash);
    expect(refreshToken.familyId).toBe(familyId);
    expect(refreshToken.isRevoked).toBe(false);
    expect(refreshToken.expiresAt).toEqual(expiresAt);

    // Test cascade delete: deleting user deletes linked refresh tokens
    await prisma.user.delete({
      where: { id: user.id },
    });

    const foundToken = await prisma.refreshToken.findUnique({
      where: { id: refreshToken.id },
    });
    expect(foundToken).toBeNull();
  });

  it("4. enforces uniqueness of tokenHash on RefreshToken model", async () => {
    const user = await prisma.user.create({
      data: {
        email: "token.unique@example.com",
        name: "Token Unique User",
        passwordHash: await PasswordService.hashPassword("Password123!"),
      },
    });

    const tokenHash = "same_token_hash_value";

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId: "fam_1",
        expiresAt: new Date(Date.now() + 10000),
      },
    });

    await expect(
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          familyId: "fam_2",
          expiresAt: new Date(Date.now() + 10000),
        },
      })
    ).rejects.toThrow();
  });
});
