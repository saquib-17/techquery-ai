import jwt, { type SignOptions, type VerifyOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { config } from "../config/index.js";
import { UnauthorizedError } from "../errors/AppError.js";

export interface AccessTokenPayload {
  userId: string;
  role: string;
  tier: string;
}

export interface JwtClaims {
  sub: string;
  role: string;
  tier: string;
  jti: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export class JwtService {
  private static readonly ALGORITHM = "HS256";

  /**
   * Signs an access token with short-lived expiration (15 minutes).
   * Includes required standard claims: sub, role, tier, jti, iss, aud, iat, exp.
   */
  public static signAccessToken(payload: AccessTokenPayload): string {
    const jti = randomUUID();

    const signOptions: SignOptions = {
      algorithm: this.ALGORITHM,
      expiresIn: config.JWT_EXPIRES_IN as any,
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
      subject: payload.userId,
      jwtid: jti,
    };

    const tokenClaims = {
      role: payload.role,
      tier: payload.tier,
    };

    return jwt.sign(tokenClaims, config.JWT_ACCESS_SECRET, signOptions);
  }

  /**
   * Verifies an access token with strict algorithm enforcement (HS256)
   * and strict issuer/audience checking.
   * Throws UnauthorizedError on invalid, tampered, expired, or malformed tokens.
   */
  public static verifyAccessToken(token: string): JwtClaims {
    const verifyOptions: VerifyOptions = {
      algorithms: [this.ALGORITHM],
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
      complete: false,
    };

    try {
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET, verifyOptions) as any;
      if (typeof decoded !== "object" || !decoded || !decoded.sub) {
        throw new UnauthorizedError("Invalid token claims", "INVALID_TOKEN");
      }

      const claims = decoded;
      return {
        sub: claims.sub,
        role: claims.role,
        tier: claims.tier,
        jti: claims.jti,
        iss: claims.iss,
        aud: claims.aud,
        iat: claims.iat,
        exp: claims.exp,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedError("Access token has expired", "TOKEN_EXPIRED");
      }

      if (error.name === "JsonWebTokenError") {
        throw new UnauthorizedError("Invalid access token", "INVALID_TOKEN");
      }

      if (error.name === "NotBeforeError") {
        throw new UnauthorizedError("Token is not active yet", "TOKEN_INACTIVE");
      }

      throw new UnauthorizedError("Token verification failed", "TOKEN_VERIFICATION_FAILED");
    }
  }
}
