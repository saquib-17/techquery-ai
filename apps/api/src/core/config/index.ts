import dotenv from "dotenv";
import { envSchema, type Env } from "./env.schema.js";

// Load environment variables from .env file if present
dotenv.config();

export interface ValidationIssue {
  path?: Array<string | number | symbol>;
  message: string;
}

/**
 * Format Zod validation errors into human-readable messages without leaking any values.
 */
export const formatEnvErrors = (issues: ValidationIssue[] = []): string => {
  const formatted = issues
    .map((issue) => {
      const fieldPath = issue.path && issue.path.length > 0 ? issue.path.join(".") : "root";
      return `  - [${fieldPath}]: ${issue.message}`;
    })
    .join("\n");
  return `Environment configuration validation failed:\n${formatted}`;
};

/**
 * Validate and parse environment variables.
 * Can accept custom raw inputs for deterministic testing.
 */
export const validateEnv = (rawEnv: Record<string, unknown> = process.env): Env => {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    // In Zod v4 / v3, issues or errors provide the list of validation issues
    const issues = (result.error as any).issues || (result.error as any).errors || [];
    const errorMsg = formatEnvErrors(issues);
    throw new Error(errorMsg);
  }

  return result.data;
};

// Singleton validated configuration object for the application
let cachedEnv: Env | null = null;

export const getConfig = (): Env => {
  if (!cachedEnv) {
    try {
      cachedEnv = validateEnv(process.env);
    } catch (err) {
      // In production or runtime boot, fail fast with structured error output
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[FATAL CONFIG ERROR] ${message}\n`);
      process.exit(1);
    }
  }
  return cachedEnv;
};

// Export configuration singleton
export const config = getConfig();
export * from "./env.schema.js";
