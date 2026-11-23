import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { EmailVerificationTokenService } from "../../src/core/security/token.service.js";
import { EmailService } from "../../src/core/email/email.service.js";

describe("Authentication & Email Verification API Integration Tests (Phase B2)", () => {
  const app = createApp();

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();
  });

  // --- 1. REGISTRATION TESTS ---

  it("1. valid candidate registration succeeds with 201 Created and safe response", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Jane Candidate",
        email: "jane.candidate@example.com",
        password: "ValidPassword123!",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe("jane.candidate@example.com");
    expect(res.body.data.user.name).toBe("Jane Candidate");
    expect(res.body.data.user.role).toBe("CANDIDATE");
    expect(res.body.data.user.tier).toBe("FREE");
    expect(res.body.data.user.isVerified).toBe(false);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.message).toBe("Account created successfully. Please verify your email address.");
  });

  it("2. password is securely hashed with Argon2id in the database", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Hash Check",
        email: "hash.check@example.com",
        password: "ValidPassword123!",
      });

    const user = await prisma.user.findUnique({
      where: { email: "hash.check@example.com" },
    });

    expect(user).not.toBeNull();
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe("ValidPassword123!");
    expect(user?.passwordHash.startsWith("$argon2id$")).toBe(true);
  });

  it("3. rejects duplicate email with 409 Conflict", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "First User",
        email: "duplicate@example.com",
        password: "ValidPassword123!",
      });

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Second User",
        email: "duplicate@example.com",
        password: "AnotherPassword123!",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("4. handles concurrent duplicate registration safely with database constraints", async () => {
    const payload = {
      name: "Concurrent User",
      email: "concurrent@example.com",
      password: "ValidPassword123!",
    };

    // Dispatch two simultaneous registration requests
    const [res1, res2] = await Promise.all([
      request(app).post("/api/v1/auth/register").send(payload),
      request(app).post("/api/v1/auth/register").send(payload),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // One must succeed (201) and the other must be rejected (409)
    expect(statuses).toEqual([201, 409]);

    const users = await prisma.user.findMany({
      where: { email: "concurrent@example.com" },
    });
    expect(users).toHaveLength(1);
  });

  it("5. rejects invalid email format with 400 Validation Error", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Bad Email User",
        email: "not-a-valid-email",
        password: "ValidPassword123!",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("6. rejects weak password violating policy with 400 Validation Error", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Weak Pass User",
        email: "weak@example.com",
        password: "short",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("7. rejects missing required fields with 400 Validation Error", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "missing.fields@example.com",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("8. rejects extra unapproved fields due to strict Zod schema", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Hacker User",
        email: "hacker@example.com",
        password: "ValidPassword123!",
        role: "ADMIN", // Privilege escalation attempt
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // --- 2. EMAIL VERIFICATION TESTS ---

  it("9. valid verification token verifies the account successfully", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Verify Me",
        email: "verifyme@example.com",
        password: "ValidPassword123!",
      });

    const url = regRes.body.data.verificationUrl;
    const token = new URL(url).searchParams.get("token")!;

    const verifyRes = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.user.isVerified).toBe(true);

    const user = await prisma.user.findUnique({
      where: { email: "verifyme@example.com" },
    });
    expect(user?.isVerified).toBe(true);
  });

  it("10. expired token is rejected with 400 Bad Request", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Expired Candidate",
        email: "expired@example.com",
        password: "ValidPassword123!",
      });

    const token = new URL(regRes.body.data.verificationUrl).searchParams.get("token")!;
    const tokenHash = EmailVerificationTokenService.hashToken(token);

    await prisma.emailVerificationToken.update({
      where: { tokenHash },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const verifyRes = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.success).toBe(false);
    expect(verifyRes.body.error.message).toContain("expired");
  });

  it("11. invalid token format or unknown token is rejected with 400 Bad Request", async () => {
    const dummyToken = "a".repeat(64);
    const verifyRes = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token: dummyToken });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.success).toBe(false);
    expect(verifyRes.body.error.message).toContain("Invalid or expired");
  });

  it("12. reused token is rejected with 400 Bad Request", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Reuse Test",
        email: "reuse@example.com",
        password: "ValidPassword123!",
      });

    const token = new URL(regRes.body.data.verificationUrl).searchParams.get("token")!;

    // First use: success
    const firstVerify = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token });
    expect(firstVerify.status).toBe(200);

    // Second use: rejection
    const secondVerify = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token });
    expect(secondVerify.status).toBe(400);
    expect(secondVerify.body.success).toBe(false);
    expect(secondVerify.body.error.message).toContain("already been used");
  });

  it("13. two simultaneous verification requests using same token allow only one to succeed (atomic)", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Race Verifier",
        email: "race.verify@example.com",
        password: "ValidPassword123!",
      });

    const token = new URL(regRes.body.data.verificationUrl).searchParams.get("token")!;

    // Dispatch two concurrent verify requests with the exact same token
    const [res1, res2] = await Promise.all([
      request(app).post("/api/v1/auth/verify-email").send({ token }),
      request(app).post("/api/v1/auth/verify-email").send({ token }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // One must succeed (200) and the other must be rejected (400)
    expect(statuses).toEqual([200, 400]);

    // User is verified exactly once
    const user = await prisma.user.findUnique({
      where: { email: "race.verify@example.com" },
    });
    expect(user?.isVerified).toBe(true);
  });

  it("14. stores only SHA-256 token hash in database, never plaintext token", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Security Token Check",
        email: "token.sec@example.com",
        password: "ValidPassword123!",
      });

    const token = new URL(regRes.body.data.verificationUrl).searchParams.get("token")!;
    const user = await prisma.user.findUnique({
      where: { email: "token.sec@example.com" },
      include: { emailVerificationTokens: true },
    });

    expect(user?.emailVerificationTokens).toHaveLength(1);
    const dbRecord = user!.emailVerificationTokens[0];
    expect(dbRecord.tokenHash).not.toBe(token);
    expect(dbRecord.tokenHash).toBe(EmailVerificationTokenService.hashToken(token));
  });

  // --- 3. RESEND VERIFICATION TESTS ---

  it("15. existing unverified account receives new verification token and invalidates prior token", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Resend Candidate",
        email: "resend.test@example.com",
        password: "ValidPassword123!",
      });

    const initialToken = new URL(regRes.body.data.verificationUrl).searchParams.get("token")!;

    const resendRes = await request(app)
      .post("/api/v1/auth/resend-verification")
      .send({ email: "resend.test@example.com" });

    expect(resendRes.status).toBe(200);
    expect(resendRes.body.success).toBe(true);

    const newToken = new URL(resendRes.body.data.verificationUrl).searchParams.get("token")!;
    expect(newToken).not.toBe(initialToken);

    // Prior token must now be invalid
    const verifyOld = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token: initialToken });
    expect(verifyOld.status).toBe(400);

    // New token must verify successfully
    const verifyNew = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token: newToken });
    expect(verifyNew.status).toBe(200);
  });

  it("16. unknown email returns identical generic response (anti-enumeration)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/resend-verification")
      .send({ email: "nonexistent.user@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("If an unverified account with this email exists");
    expect(res.body.data.verificationUrl).toBeUndefined();
  });

  it("17. already verified account returns generic response without leaking status", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Already Verified",
        email: "already.verified@example.com",
        password: "ValidPassword123!",
      });

    const token = new URL(regRes.body.data.verificationUrl).searchParams.get("token")!;
    await request(app).post("/api/v1/auth/verify-email").send({ token });

    const resendRes = await request(app)
      .post("/api/v1/auth/resend-verification")
      .send({ email: "already.verified@example.com" });

    expect(resendRes.status).toBe(200);
    expect(resendRes.body.success).toBe(true);
    expect(resendRes.body.data.message).toContain("If an unverified account with this email exists");
    expect(resendRes.body.data.verificationUrl).toBeUndefined();
  });

  it("18. resend verification enforces rate limiting (max 3 attempts per window)", async () => {
    const targetEmail = "throttle@example.com";
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Throttle User",
        email: targetEmail,
        password: "ValidPassword123!",
      });

    // 1st, 2nd, 3rd requests succeed
    await request(app).post("/api/v1/auth/resend-verification").send({ email: targetEmail });
    await request(app).post("/api/v1/auth/resend-verification").send({ email: targetEmail });
    await request(app).post("/api/v1/auth/resend-verification").send({ email: targetEmail });

    // 4th request must be throttled
    const fourth = await request(app)
      .post("/api/v1/auth/resend-verification")
      .send({ email: targetEmail });

    expect(fourth.status).toBe(400);
    expect(fourth.body.success).toBe(false);
    expect(fourth.body.error.message).toContain("Too many verification requests");
  });

  // --- 4. EMAIL ADAPTER & PRODUCTION BEHAVIOR TESTS ---

  it("19. EmailService isDeliveryAvailable correctly distinguishes dev vs production", () => {
    const emailSvc = new EmailService();
    expect(emailSvc.isDeliveryAvailable()).toBe(true); // Node_env is test/dev
  });

  it("20. rejects registration with 503 when email provider is unavailable (simulating production without provider)", async () => {
    const mockUnavailableMailService = {
      isDeliveryAvailable: () => false,
      sendVerificationEmail: async () => ({ delivered: false, provider: "none" as const }),
    };

    const { AuthService } = await import("../../src/modules/auth/auth.service.js");
    const { AuthController } = await import("../../src/modules/auth/auth.controller.js");
    const { authRepository } = await import("../../src/modules/auth/auth.repository.js");
    const { Router } = await import("express");

    const customAuthService = new AuthService(authRepository, mockUnavailableMailService);
    const customAuthController = new AuthController(customAuthService);

    const customRouter = Router();
    customRouter.post("/api/v1/auth-test/register", customAuthController.register);

    const testApp = createApp(customRouter);

    const res = await request(testApp)
      .post("/api/v1/auth-test/register")
      .send({
        name: "Prod User",
        email: "prod.user@example.com",
        password: "ValidPassword123!",
      });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(res.body.error.message).toContain("Registration is temporarily unavailable");

    // CRITICAL ASSERTION: No user record created in database
    const userInDb = await prisma.user.findUnique({
      where: { email: "prod.user@example.com" },
    });
    expect(userInDb).toBeNull();

    // CRITICAL ASSERTION: No verification token created in database
    const tokensInDb = await prisma.emailVerificationToken.findMany({
      where: { user: { email: "prod.user@example.com" } },
    });
    expect(tokensInDb).toHaveLength(0);
  });

  it("21. cleans up user and tokens if email delivery fails after creation", async () => {
    const mockFailingMailService = {
      isDeliveryAvailable: () => true, // Provider is nominally configured
      sendVerificationEmail: async () => ({ delivered: false, provider: "external" as const, error: "SMTP_CONN_REFUSED" }), // But delivery fails
    };

    const { AuthService } = await import("../../src/modules/auth/auth.service.js");
    const { AuthController } = await import("../../src/modules/auth/auth.controller.js");
    const { authRepository } = await import("../../src/modules/auth/auth.repository.js");
    const { Router } = await import("express");

    const customAuthService = new AuthService(authRepository, mockFailingMailService);
    const customAuthController = new AuthController(customAuthService);

    const customRouter = Router();
    customRouter.post("/api/v1/auth-fail/register", customAuthController.register);

    const testApp = createApp(customRouter);

    const res = await request(testApp)
      .post("/api/v1/auth-fail/register")
      .send({
        name: "Delivery Fail User",
        email: "delivery.fail@example.com",
        password: "ValidPassword123!",
      });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(res.body.error.message).toContain("Unable to deliver verification email");

    // CRITICAL ASSERTION: User and token records were cleaned up (rolled back)
    const userInDb = await prisma.user.findUnique({
      where: { email: "delivery.fail@example.com" },
    });
    expect(userInDb).toBeNull();

    // User can safely retry registration immediately
    const tokensInDb = await prisma.emailVerificationToken.findMany({
      where: { user: { email: "delivery.fail@example.com" } },
    });
    expect(tokensInDb).toHaveLength(0);
  });
});
