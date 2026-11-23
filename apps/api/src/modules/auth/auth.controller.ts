import type { Request, Response, NextFunction } from "express";
import { authService, AuthService } from "./auth.service.js";
import { registerSchema, verifyEmailSchema, resendVerificationSchema, loginSchema } from "./auth.schemas.js";
import { sendSuccess } from "../../core/responses/index.js";
import { ValidationError } from "../../core/errors/AppError.js";
import {
  REFRESH_COOKIE_NAME,
  getRefreshTokenCookieOptions,
  getClearRefreshTokenCookieOptions,
} from "../../core/security/cookie.config.js";

export class AuthController {
  constructor(private service: AuthService = authService) {}

  /**
   * POST /api/v1/auth/register
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError("Invalid registration details", details);
      }

      const result = await this.service.register(parsed.data);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/verify-email
   */
  public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = verifyEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError("Invalid verification payload", details);
      }

      const result = await this.service.verifyEmail(parsed.data);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/resend-verification
   */
  public resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = resendVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError("Invalid email format", details);
      }

      const result = await this.service.resendVerification(parsed.data);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/login
   * Returns user and accessToken in response body. Sets HttpOnly refreshToken cookie.
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError("Invalid login credentials", details);
      }

      const { user, accessToken, refreshToken } = await this.service.login(parsed.data);

      // Set HttpOnly cookie for refresh token
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

      sendSuccess(
        res,
        {
          user,
          accessToken,
        },
        200
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/refresh
   * Reads refreshToken from HttpOnly cookie (or body fallback), rotates it,
   * sets new cookie, and returns new accessToken in response body.
   */
  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      const { accessToken, refreshToken: newRefreshToken } = await this.service.refreshToken(refreshToken);

      // Set new rotated refresh token in HttpOnly cookie
      res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshTokenCookieOptions());

      sendSuccess(
        res,
        {
          accessToken,
        },
        200
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/logout
   * Revokes the presented refresh token and clears the HttpOnly cookie.
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      await this.service.logout(refreshToken);

      res.clearCookie(REFRESH_COOKIE_NAME, getClearRefreshTokenCookieOptions());

      sendSuccess(res, { message: "Logged out successfully" }, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/logout-all
   * Revokes all active refresh tokens for the authenticated user and clears the cookie.
   */
  public logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      await this.service.logoutAll(userId!);

      res.clearCookie(REFRESH_COOKIE_NAME, getClearRefreshTokenCookieOptions());

      sendSuccess(res, { message: "Logged out from all sessions successfully" }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
