import { prisma } from "../../core/database/index.js";
import type { User, EmailVerificationToken, RefreshToken } from "@prisma/client";

export class AuthRepository {
  /**
   * Finds an existing user by normalized email address.
   */
  public async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Finds an existing user by primary key ID.
   */
  public async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Deletes a user by primary key ID (cascades to all user tokens).
   */
  public async deleteUserById(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Creates a user and associated email verification token inside an atomic transaction.
   */
  public async createUserWithVerificationToken(data: {
    name: string;
    email: string;
    passwordHash: string;
    tokenHash: string;
    tokenExpiresAt: Date;
  }): Promise<{ user: User; verificationToken: EmailVerificationToken }> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: "CANDIDATE",
          tier: "FREE",
          isVerified: false,
        },
      });

      const verificationToken = await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: data.tokenHash,
          expiresAt: data.tokenExpiresAt,
          isUsed: false,
        },
      });

      return { user, verificationToken };
    });
  }

  /**
   * Finds an unused, valid verification token record by its token hash.
   */
  public async findVerificationTokenByHash(tokenHash: string): Promise<(EmailVerificationToken & { user: User }) | null> {
    return prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  /**
   * Atomically marks an email verification token as used and the user as verified.
   * Guarantees that only ONE concurrent consumer can update the token.
   * If the token was already consumed (or updated concurrently), returns null.
   */
  public async markUserVerified(tokenId: string, userId: string): Promise<User | null> {
    return prisma.$transaction(async (tx) => {
      // Conditional atomic update: only updates if isUsed is still false
      const updateResult = await tx.emailVerificationToken.updateMany({
        where: {
          id: tokenId,
          isUsed: false,
        },
        data: { isUsed: true },
      });

      // If no row was updated, another concurrent consumer already consumed the token
      if (updateResult.count === 0) {
        return null;
      }

      return tx.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });
    });
  }

  /**
   * Invalidates any outstanding active verification tokens for a given user.
   */
  public async invalidateActiveTokensForUser(userId: string): Promise<void> {
    await prisma.emailVerificationToken.updateMany({
      where: {
        userId,
        isUsed: false,
      },
      data: { isUsed: true },
    });
  }

  /**
   * Creates a new email verification token for a user.
   */
  public async createVerificationToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken> {
    return prisma.emailVerificationToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        isUsed: false,
      },
    });
  }

  /**
   * Creates a new refresh token record.
   */
  public async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        expiresAt: data.expiresAt,
        isRevoked: false,
      },
    });
  }

  /**
   * Finds a refresh token by its SHA-256 hash, including the associated user.
   */
  public async findRefreshTokenByHash(tokenHash: string): Promise<(RefreshToken & { user: User }) | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  /**
   * Rotates a refresh token inside an atomic transaction:
   * 1. Conditionally marks the old token as revoked (only if isRevoked is false).
   * 2. If successfully revoked, inserts the new token into the same familyId.
   * 3. If old token was already revoked (or updated concurrently), returns null.
   */
  public async rotateRefreshToken(
    oldTokenId: string,
    newToken: {
      userId: string;
      tokenHash: string;
      familyId: string;
      expiresAt: Date;
    }
  ): Promise<RefreshToken | null> {
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.refreshToken.updateMany({
        where: {
          id: oldTokenId,
          isRevoked: false,
        },
        data: { isRevoked: true },
      });

      if (updateResult.count === 0) {
        return null;
      }

      return tx.refreshToken.create({
        data: {
          userId: newToken.userId,
          tokenHash: newToken.tokenHash,
          familyId: newToken.familyId,
          expiresAt: newToken.expiresAt,
          isRevoked: false,
        },
      });
    });
  }

  /**
   * Revokes all refresh tokens in a token family (triggered on reuse detection).
   */
  public async revokeFamily(familyId: string): Promise<number> {
    const result = await prisma.refreshToken.updateMany({
      where: {
        familyId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });
    return result.count;
  }

  /**
   * Revokes a specific refresh token by its hash.
   */
  public async revokeRefreshTokenByHash(tokenHash: string): Promise<boolean> {
    const result = await prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });
    return result.count > 0;
  }

  /**
   * Revokes all active refresh tokens for a user across all families (logout-all).
   */
  public async revokeAllUserRefreshTokens(userId: string): Promise<number> {
    const result = await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });
    return result.count;
  }
}

export const authRepository = new AuthRepository();
