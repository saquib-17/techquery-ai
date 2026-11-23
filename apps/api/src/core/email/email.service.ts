import { config } from "../config/index.js";
import { logger } from "../logger/index.js";

export interface SendVerificationEmailParams {
  email: string;
  name: string;
  token: string;
}

export interface EmailDeliveryResult {
  delivered: boolean;
  provider: "console" | "external" | "none";
  verificationUrl?: string;
  error?: string;
}

export interface IEmailService {
  sendVerificationEmail(params: SendVerificationEmailParams): Promise<EmailDeliveryResult>;
  isDeliveryAvailable(): boolean;
}

export class EmailService implements IEmailService {
  /**
   * Checks whether an active email delivery channel is operational in the current environment.
   * - Development / Test: Always true (Console / Local delivery adapter).
   * - Production: False unless an external provider (such as Resend Free Tier) is actively configured via environment.
   */
  public isDeliveryAvailable(): boolean {
    if (config.NODE_ENV !== "production") {
      return true;
    }
    // Future Resend Free Tier integration point: return Boolean(process.env.RESEND_API_KEY)
    return false;
  }

  /**
   * Delivers an account verification email or logs URL in non-production environments.
   *
   * Zero-cost architecture design:
   * - In development/test mode: construct the verification URL and log to stdout using Pino.
   *   Never expose token hashes or passwords.
   * - In production: if no external provider is configured, explicitly report delivered: false with provider: "none".
   *   Never log raw tokens or verification URLs in production.
   */
  public async sendVerificationEmail(params: SendVerificationEmailParams): Promise<EmailDeliveryResult> {
    const { email, name, token } = params;
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${token}`;

    if (config.NODE_ENV !== "production") {
      // In local dev/test: log verification link for friction-free developer onboarding
      logger.info(
        { email, name, verificationUrl },
        `[LOCAL DEV AUTH] Account verification link for ${name} <${email}>: ${verificationUrl}`
      );
      return {
        delivered: true,
        provider: "console",
        verificationUrl,
      };
    }

    // In production without configured external email provider:
    // Never log verificationUrl or token in production!
    logger.warn(
      { email },
      "Production email delivery not configured; verification email could not be dispatched."
    );
    return {
      delivered: false,
      provider: "none",
      error: "EMAIL_PROVIDER_UNAVAILABLE",
    };
  }
}

export const emailService = new EmailService();
