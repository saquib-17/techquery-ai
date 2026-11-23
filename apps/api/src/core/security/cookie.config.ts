import type { CookieOptions } from "express";
import { config } from "../config/index.js";

export const REFRESH_COOKIE_NAME = "refreshToken";

/**
 * Returns cookie options for setting the HttpOnly refresh token cookie.
 * - httpOnly: prevents client-side JS access (mitigates XSS)
 * - secure: true in production (HTTPS-only)
 * - sameSite: 'strict' in production, 'lax' in development
 * - path: restricted to /api/v1/auth to avoid sending cookie on every static or API asset
 * - maxAge: in milliseconds based on REFRESH_TOKEN_EXPIRES_DAYS
 */
export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const isProd = config.NODE_ENV === "production";
  const maxAgeMs = config.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/api/v1/auth",
    maxAge: maxAgeMs,
  };
};

/**
 * Returns cookie options to clear the refresh token cookie.
 * Must match the path, secure, and sameSite properties used when setting it.
 */
export const getClearRefreshTokenCookieOptions = (): CookieOptions => {
  const isProd = config.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/api/v1/auth",
  };
};
