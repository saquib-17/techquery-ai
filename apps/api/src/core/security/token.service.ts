import crypto from "crypto";

export interface GeneratedToken {
  token: string;      // Plaintext token (to send to user/URL once)
  tokenHash: string;  // SHA-256 hash (to store in database)
  expiresAt: Date;    // Expiration timestamp
}

export class EmailVerificationTokenService {
  /**
   * Token lifetime: 24 hours in milliseconds
   */
  public static readonly TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000;

  /**
   * Generates a 32-byte cryptographically secure random token (64 hex characters)
   * and its corresponding SHA-256 hash.
   */
  public static generateVerificationToken(): GeneratedToken {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRATION_MS);

    return {
      token,
      tokenHash,
      expiresAt,
    };
  }

  /**
   * Computes a SHA-256 digest of the given plaintext token.
   */
  public static hashToken(token: string): string {
    if (!token || typeof token !== "string") {
      throw new Error("Token must be a non-empty string");
    }
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Compares two tokens using timing-safe comparison to prevent side-channel timing attacks.
   */
  public static compareTokens(tokenA: string, tokenB: string): boolean {
    if (!tokenA || !tokenB || typeof tokenA !== "string" || typeof tokenB !== "string") {
      return false;
    }
    const bufA = Buffer.from(tokenA);
    const bufB = Buffer.from(tokenB);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }
}

/**
 * General purpose cryptographic token utilities.
 */
export class TokenUtils {
  /**
   * Generates a 32-byte cryptographically secure random token (64 hex characters).
   */
  public static generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Computes a SHA-256 digest of the given plaintext token.
   */
  public static hashToken(token: string): string {
    if (!token || typeof token !== "string") {
      throw new Error("Token must be a non-empty string");
    }
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Compares two tokens using constant-time comparison.
   */
  public static compareTokens(tokenA: string, tokenB: string): boolean {
    return EmailVerificationTokenService.compareTokens(tokenA, tokenB);
  }
}
