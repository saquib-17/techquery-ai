import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors/AppError.js";
import { config } from "../config/index.js";

/**
 * Origin and Referer validation middleware for state-changing cookie-authenticated requests.
 * Provides defense-in-depth against Cross-Site Request Forgery (CSRF).
 *
 * Requirements:
 * - Browsers send 'Origin' on all cross-origin requests and on same-origin POST/PUT/DELETE requests.
 * - If 'Origin' is absent (e.g., certain same-origin navigations or older proxies), checks 'Referer'.
 * - If neither is present, in non-browser automated server-to-server or non-cookie contexts,
 *   we allow only if the request does NOT present cookies. If cookies ARE present, Origin/Referer
 *   is strictly required to match FRONTEND_URL.
 */
export const validateSameOrigin = (req: Request, _res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const expectedOrigin = config.FRONTEND_URL;

  // If client provided Origin, it must strictly match FRONTEND_URL
  if (origin) {
    if (origin !== expectedOrigin) {
      throw new ForbiddenError(`CSRF check failed: invalid Origin ${origin}`, "CSRF_ORIGIN_INVALID");
    }
    return next();
  }

  // If no Origin, check Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== expectedOrigin) {
        throw new ForbiddenError(`CSRF check failed: invalid Referer origin ${refererOrigin}`, "CSRF_REFERER_INVALID");
      }
      return next();
    } catch {
      throw new ForbiddenError("CSRF check failed: malformed Referer header", "CSRF_REFERER_MALFORMED");
    }
  }

  // If neither Origin nor Referer is present:
  // In development/test mode or if no cookies are passed, allow (e.g. CLI curl, mobile, Supertest)
  // But if cookies are present in production, reject missing origin headers for state-changing requests
  if (config.NODE_ENV === "production" && req.cookies && Object.keys(req.cookies).length > 0) {
    throw new ForbiddenError("CSRF check failed: missing Origin and Referer headers", "CSRF_MISSING_ORIGIN");
  }

  next();
};
