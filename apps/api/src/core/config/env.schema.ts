import { z } from "zod";

export const LogLevelSchema = z.enum([
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
]);

export const NodeEnvSchema = z.enum(["development", "test", "production"]);
export const AppModeSchema = z.enum(["local", "cloud"]);
export const AiProviderSchema = z.enum(["ollama", "groq", "mock"]);

const postgresUrlValidator = (url: string) =>
  url.startsWith("postgresql://") || url.startsWith("postgres://");

export const envSchema = z
  .object({
    NODE_ENV: NodeEnvSchema.default("development"),
    APP_MODE: AppModeSchema.default("local"),
    PORT: z.coerce
      .number()
      .int("PORT must be an integer")
      .min(1, "PORT must be at least 1")
      .max(65535, "PORT must be at most 65535")
      .default(4000),
    LOG_LEVEL: LogLevelSchema.optional(),
    FRONTEND_URL: z
      .string()
      .url("FRONTEND_URL must be a valid URL")
      .default("http://localhost:5173"),
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .refine(
        postgresUrlValidator,
        "DATABASE_URL must be a valid PostgreSQL connection URL"
      )
      .default("postgresql://techquery_runtime:redacted_default@127.0.0.1:5432/techquery_dev"),
    MIGRATION_DATABASE_URL: z
      .string()
      .refine(
        postgresUrlValidator,
        "MIGRATION_DATABASE_URL must be a valid PostgreSQL connection URL"
      )
      .optional(),
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 characters long")
      .default("default_dev_jwt_access_secret_do_not_use_in_prod_1234567890"),
    JWT_ISSUER: z.string().default("techquery-api"),
    JWT_AUDIENCE: z.string().default("techquery-web"),
    JWT_EXPIRES_IN: z.string().default("15m"),
    REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
    STORAGE_DIR: z.string().default("./uploads/resumes"),
    MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024), // 5MB
    AI_PROVIDER: AiProviderSchema.default("ollama"),
    OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
    AI_LOCAL_MODEL: z.string().min(1).default("llama3.2:3b"),
    GROQ_API_KEY: z.string().optional(),
    GROQ_MODEL: z.string().min(1).default("openai/gpt-oss-120b"),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
    JUDGE0_API_URL: z
      .string()
      .url("JUDGE0_API_URL must be a valid URL")
      .default("https://ce.judge0.com"),
    JUDGE0_API_KEY: z.string().optional(),
  })
  .transform((data) => {
    // If LOG_LEVEL is not explicitly provided, choose based on NODE_ENV
    const effectiveLogLevel =
      data.LOG_LEVEL ?? (data.NODE_ENV === "development" ? "debug" : "info");
    return {
      ...data,
      LOG_LEVEL: effectiveLogLevel,
    };
  });

export type Env = z.infer<typeof envSchema>;
