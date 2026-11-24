import { authRepository, AuthRepository } from "./auth.repository.js";
import { PasswordService } from "../../core/security/password.service.js";
import { EmailVerificationTokenService, TokenUtils } from "../../core/security/token.service.js";
import { JwtService } from "../../core/security/jwt.service.js";
import { emailService, IEmailService } from "../../core/email/email.service.js";
import { ConflictError, BadRequestError, UnauthorizedError, ServiceUnavailableError } from "../../core/errors/AppError.js";
import { config } from "../../core/config/index.js";
import { logger } from "../../core/logger/index.js";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { RegisterInput, VerifyEmailInput, ResendVerificationInput, LoginInput } from "./auth.schemas.js";

// Safe public user projection (never returns passwordHash or internal credentials)
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private resendAttempts = new Map<string, { count: number; firstAttempt: number }>();
  private loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
  private refreshAttempts = new Map<string, { count: number; firstAttempt: number }>();

  constructor(
    private repository: AuthRepository = authRepository,
    private mailService: IEmailService = emailService
  ) {}

  /**
   * Registers a new candidate.
   * In production, validates email provider availability BEFORE creating user or token records.
   * If delivery fails, performs safe rollback so no unusable user/token records remain.
   */
  public async register(input: RegisterInput): Promise<{ user: PublicUser; message: string; verificationUrl?: string }> {
    const email = input.email.toLowerCase().trim();

    // 1. Production provider availability pre-check
    if (!this.mailService.isDeliveryAvailable()) {
      throw new ServiceUnavailableError("Registration is temporarily unavailable. Please try again later.");
    }

    // 2. Application-level check
    const existing = await this.repository.findByEmail(email);
    if (existing) {
      throw new ConflictError("An account with this email address already exists", "EMAIL_ALREADY_EXISTS");
    }

    // 3. Hash password with Argon2id
    const passwordHash = await PasswordService.hashPassword(input.password);

    // 4. Generate verification token
    const tokenData = EmailVerificationTokenService.generateVerificationToken();

    // 5. Create user and store token hash in transaction
    let createdUserId: string | null = null;
    try {
      const { user } = await this.repository.createUserWithVerificationToken({
        name: input.name.trim(),
        email,
        passwordHash,
        tokenHash: tokenData.tokenHash,
        tokenExpiresAt: tokenData.expiresAt,
      });

      createdUserId = user.id;

      // 6. Send verification email via abstraction
      const deliveryResult = await this.mailService.sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: tokenData.token,
      });

      if (!deliveryResult.delivered) {
        // Rollback: Clean up created user and cascading tokens to prevent unusable registration state
        await this.cleanupFailedRegistration(createdUserId);
        throw new ServiceUnavailableError("Unable to deliver verification email. Please try registering again.");
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tier: user.tier,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        message: "Account created successfully. Please verify your email address.",
        // Only exposed in non-production environments to assist development / automated testing
        verificationUrl: deliveryResult.verificationUrl,
      };
    } catch (err) {
      // If error occurred after creation, ensure rollback cleanup was attempted
      if (createdUserId && !(err instanceof ServiceUnavailableError)) {
        await this.cleanupFailedRegistration(createdUserId).catch(() => {});
      }

      // Handle database-level concurrent race on duplicate email (P2002)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("An account with this email address already exists", "EMAIL_ALREADY_EXISTS");
      }
      throw err;
    }
  }

  /**
   * Safely deletes a user (and cascades to tokens) if post-creation email delivery fails.
   */
  private async cleanupFailedRegistration(userId: string): Promise<void> {
    try {
      // Deleting user cascades to email_verification_tokens via FK constraint
      await this.repository.deleteUserById(userId);
    } catch {
      // Ignore cleanup error if record was not persisted
    }
  }

  /**
   * Verifies an account using a single-use verification token.
   * Atomically checks validity, expiration, and marks user as verified.
   * Guarantees race-condition safety: two concurrent requests cannot both succeed.
   */
  public async verifyEmail(input: VerifyEmailInput): Promise<{ message: string; user: PublicUser }> {
    const tokenHash = EmailVerificationTokenService.hashToken(input.token.trim());

    const tokenRecord = await this.repository.findVerificationTokenByHash(tokenHash);
    if (!tokenRecord) {
      throw new BadRequestError("Invalid or expired verification token");
    }

    if (tokenRecord.isUsed) {
      throw new BadRequestError("This verification token has already been used");
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new BadRequestError("Verification token has expired. Please request a new one.");
    }

    // Atomically mark token used and update user isVerified
    const updatedUser = await this.repository.markUserVerified(tokenRecord.id, tokenRecord.user.id);
    if (!updatedUser) {
      // Another concurrent request consumed the token between find and update
      throw new BadRequestError("This verification token has already been used");
    }

    return {
      message: "Email address verified successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        tier: updatedUser.tier,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    };
  }

  /**
   * Resends verification email.
   * - Prevents user enumeration by returning identical generic success message.
   * - Enforces in-memory sliding-window abuse throttling (max 3 resends per 15 mins per email).
   * - Invalidates prior active tokens and issues a new one.
   */
  public async resendVerification(input: ResendVerificationInput): Promise<{ message: string; verificationUrl?: string }> {
    const email = input.email.toLowerCase().trim();

    // In-memory rate limiting check (3 requests per 15 minutes per email)
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 3;

    const record = this.resendAttempts.get(email);
    if (record) {
      if (now - record.firstAttempt < windowMs) {
        if (record.count >= maxAttempts) {
          throw new BadRequestError("Too many verification requests. Please try again later.");
        }
        record.count++;
      } else {
        this.resendAttempts.set(email, { count: 1, firstAttempt: now });
      }
    } else {
      this.resendAttempts.set(email, { count: 1, firstAttempt: now });
    }

    const user = await this.repository.findByEmail(email);

    // If user does not exist or is already verified, return generic success message to prevent enumeration
    if (!user || user.isVerified) {
      return {
        message: "If an unverified account with this email exists, a new verification link has been sent.",
      };
    }

    // Invalidate prior active tokens
    await this.repository.invalidateActiveTokensForUser(user.id);

    // Issue new token
    const tokenData = EmailVerificationTokenService.generateVerificationToken();
    await this.repository.createVerificationToken({
      userId: user.id,
      tokenHash: tokenData.tokenHash,
      expiresAt: tokenData.expiresAt,
    });

    const deliveryResult = await this.mailService.sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: tokenData.token,
    });

    return {
      message: "If an unverified account with this email exists, a new verification link has been sent.",
      verificationUrl: deliveryResult.verificationUrl,
    };
  }

  /**
   * Authenticates user with email and password.
   * - Enforces rate limiting on login attempts per email.
   * - Validates password using Argon2id with constant-time verification.
   * - Checks that account is email-verified; throws UnauthorizedError if unverified.
   * - Generates 15-minute access token and 7-day refresh token in a new family.
   */
  public async login(input: LoginInput): Promise<LoginResult> {
    const email = input.email.toLowerCase().trim();

    // 1. In-memory sliding-window rate limit (5 attempts per 15 mins per email)
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 5;

    const record = this.loginAttempts.get(email);
    if (record) {
      if (now - record.firstAttempt < windowMs) {
        if (record.count >= maxAttempts) {
          throw new UnauthorizedError("Too many login attempts. Please try again later.", "RATE_LIMIT_EXCEEDED");
        }
        record.count++;
      } else {
        this.loginAttempts.set(email, { count: 1, firstAttempt: now });
      }
    } else {
      this.loginAttempts.set(email, { count: 1, firstAttempt: now });
    }

    // 2. Fetch user by email
    const user = await this.repository.findByEmail(email);
    if (!user) {
      // Run dummy verify to mitigate timing attacks against non-existent users
      await PasswordService.verifyPassword(
        "$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHQ$dGVzdGhhc2hkdW1teQ",
        input.password
      ).catch(() => {});
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    // 3. Verify password
    const isPasswordValid = await PasswordService.verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    // Reset login attempt counter on successful credential validation
    this.loginAttempts.delete(email);

    // 4. Verify account status (must be verified)
    if (!user.isVerified) {
      throw new UnauthorizedError(
        "Please verify your email address before logging in",
        "EMAIL_NOT_VERIFIED"
      );
    }

    // 5. Generate 15-minute access JWT
    const accessToken = JwtService.signAccessToken({
      userId: user.id,
      role: user.role,
      tier: user.tier,
    });

    // 6. Generate 32-byte cryptographically secure refresh token
    const rawRefreshToken = TokenUtils.generateSecureToken();
    const tokenHash = TokenUtils.hashToken(rawRefreshToken);
    const familyId = randomUUID();
    const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    // 7. Store refresh token in database
    await this.repository.createRefreshToken({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  /**
   * Refreshes access token and rotates refresh token.
   * - Detects reuse: If presented token is already revoked, ALL tokens in the family are revoked!
   * - Validates token existence and expiry.
   * - Atomically marks presented token as revoked and issues new refresh token in same family.
   */
  public async refreshToken(rawRefreshToken: string): Promise<RefreshResult> {
    if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
      throw new UnauthorizedError("Refresh token is required", "MISSING_REFRESH_TOKEN");
    }

    const tokenHash = TokenUtils.hashToken(rawRefreshToken);

    // Sliding-window abuse throttling for refresh token operations (max 20 requests per 10 minutes per token hash)
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const maxAttempts = 20;

    const record = this.refreshAttempts.get(tokenHash);
    if (record) {
      if (now - record.firstAttempt < windowMs) {
        if (record.count >= maxAttempts) {
          throw new UnauthorizedError("Too many refresh requests. Please try again later.", "RATE_LIMIT_EXCEEDED");
        }
        record.count++;
      } else {
        this.refreshAttempts.set(tokenHash, { count: 1, firstAttempt: now });
      }
    } else {
      this.refreshAttempts.set(tokenHash, { count: 1, firstAttempt: now });
    }

    const tokenRecord = await this.repository.findRefreshTokenByHash(tokenHash);

    if (!tokenRecord) {
      throw new UnauthorizedError("Invalid refresh token", "INVALID_REFRESH_TOKEN");
    }

    // --- REUSE DETECTION ---
    if (tokenRecord.isRevoked) {
      // Security Incident: A previously consumed or revoked token was presented again!
      logger.warn(
        { familyId: tokenRecord.familyId, userId: tokenRecord.userId },
        "Security incident: Revoked refresh token reuse detected! Invalidating entire token family."
      );
      await this.repository.revokeFamily(tokenRecord.familyId);
      throw new UnauthorizedError(
        "Invalid session. Please log in again.",
        "TOKEN_REUSE_DETECTED"
      );
    }

    // Expiration check
    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedError("Refresh token has expired", "REFRESH_TOKEN_EXPIRED");
    }

    // User check (ensure user still exists)
    const user = tokenRecord.user;
    if (!user) {
      throw new UnauthorizedError("User associated with token not found", "USER_NOT_FOUND");
    }

    // Generate new refresh token in same family
    const newRawRefreshToken = TokenUtils.generateSecureToken();
    const newTokenHash = TokenUtils.hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + config.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    // Atomically rotate: old token becomes isRevoked=true, new token created
    const rotated = await this.repository.rotateRefreshToken(tokenRecord.id, {
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: tokenRecord.familyId,
      expiresAt: newExpiresAt,
    });

    if (!rotated) {
      // Concurrent rotation attempt detected: another concurrent request rotated this token
      logger.warn(
        { familyId: tokenRecord.familyId, userId: tokenRecord.userId },
        "Concurrent refresh token rotation detected; invalidating family."
      );
      await this.repository.revokeFamily(tokenRecord.familyId);
      throw new UnauthorizedError(
        "Invalid session. Please log in again.",
        "TOKEN_REUSE_DETECTED"
      );
    }

    // Issue new 15-minute access token
    const accessToken = JwtService.signAccessToken({
      userId: user.id,
      role: user.role,
      tier: user.tier,
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  /**
   * Logs out user by revoking the presented refresh token.
   * Safe to call even if token is absent or already invalid.
   */
  public async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
      return;
    }

    const tokenHash = TokenUtils.hashToken(rawRefreshToken);
    await this.repository.revokeRefreshTokenByHash(tokenHash);
  }

  /**
   * Logs out user from all devices / active sessions.
   * Revokes all refresh tokens belonging to the user.
   */
  public async logoutAll(userId: string): Promise<number> {
    if (!userId) {
      throw new UnauthorizedError("Unauthorized", "UNAUTHORIZED");
    }

    return this.repository.revokeAllUserRefreshTokens(userId);
  }
}

export const authService = new AuthService();
