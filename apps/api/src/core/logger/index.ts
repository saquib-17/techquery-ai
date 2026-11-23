import pino, { type Logger, type LoggerOptions } from "pino";
import { config } from "../config/index.js";

/**
 * List of sensitive key paths to automatically redact from log outputs.
 * Prevents accidental credential, token, connection string, or PII leakage.
 */
export const REDACTED_PATHS = [
  "password",
  "*.password",
  "token",
  "*.token",
  "refreshToken",
  "*.refreshToken",
  "accessToken",
  "*.accessToken",
  "authorization",
  "headers.authorization",
  "cookie",
  "headers.cookie",
  "secret",
  "*.secret",
  "jwtSecret",
  "*.jwtSecret",
  "JWT_ACCESS_SECRET",
  "*.JWT_ACCESS_SECRET",
  "DATABASE_URL",
  "*.DATABASE_URL",
  "databaseUrl",
  "*.databaseUrl",
  "MIGRATION_DATABASE_URL",
  "*.MIGRATION_DATABASE_URL",
  "migrationDatabaseUrl",
  "*.migrationDatabaseUrl",
];

const createLogger = (): Logger => {
  const isDevelopment = config.NODE_ENV === "development";

  const options: LoggerOptions = {
    level: config.LOG_LEVEL,
    redact: {
      paths: REDACTED_PATHS,
      censor: "[REDACTED]",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label.toUpperCase() }),
    },
  };

  if (isDevelopment) {
    return pino({
      ...options,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });
  }

  // Pure JSON logging for production and test environments
  return pino(options);
};

export const logger = createLogger();
export type { Logger } from "pino";
