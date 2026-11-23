import type { Request, Response, NextFunction } from "express";
import { JwtService, type JwtClaims } from "../security/jwt.service.js";
import { UnauthorizedError, ForbiddenError } from "../errors/AppError.js";

// Extend Express Request interface to include authenticated user details
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        tier: string;
      };
    }
  }
}

/**
 * Authentication Middleware:
 * Extracts Bearer token from Authorization header, validates claims and expiration with JwtService,
 * and attaches user context (`req.user`) to request.
 * Throws UnauthorizedError if missing or invalid.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError("Authentication token is required", "AUTH_HEADER_MISSING");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    throw new UnauthorizedError("Invalid Authorization header format. Format: Bearer <token>", "AUTH_HEADER_MALFORMED");
  }

  const token = parts[1];
  const claims: JwtClaims = JwtService.verifyAccessToken(token);

  req.user = {
    userId: claims.sub,
    role: claims.role,
    tier: claims.tier,
  };

  next();
};

/**
 * Role-Based Access Control (RBAC) Middleware:
 * Ensures the authenticated user possesses one of the allowed roles.
 * Requires requireAuth to have run prior.
 * Throws ForbiddenError if user role is insufficient.
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required", "UNAUTHORIZED");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Insufficient permissions. Required role: ${allowedRoles.join(" or ")}`,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    next();
  };
};
