import { describe, it, expect } from "vitest";
import { envSchema } from "../../../src/core/config/env.schema.js";
import { validateEnv, formatEnvErrors } from "../../../src/core/config/index.js";

describe("Environment Configuration Unit Tests", () => {
  it("should accept valid environment configuration", () => {
    const validRaw = {
      NODE_ENV: "production",
      APP_MODE: "cloud",
      PORT: "5000",
      LOG_LEVEL: "warn",
      FRONTEND_URL: "https://techquery.example.com",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      MIGRATION_DATABASE_URL: "postgresql://owner:pass@localhost:5432/db",
    };

    const parsed = validateEnv(validRaw);

    expect(parsed.NODE_ENV).toBe("production");
    expect(parsed.APP_MODE).toBe("cloud");
    expect(parsed.PORT).toBe(5000);
    expect(parsed.LOG_LEVEL).toBe("warn");
    expect(parsed.FRONTEND_URL).toBe("https://techquery.example.com");
    expect(parsed.DATABASE_URL).toBe(validRaw.DATABASE_URL);
    expect(parsed.MIGRATION_DATABASE_URL).toBe(validRaw.MIGRATION_DATABASE_URL);
  });

  it("should provide sensible development defaults", () => {
    const defaults = validateEnv({});

    expect(defaults.NODE_ENV).toBe("development");
    expect(defaults.APP_MODE).toBe("local");
    expect(defaults.PORT).toBe(4000);
    expect(defaults.LOG_LEVEL).toBe("debug");
    expect(defaults.FRONTEND_URL).toBe("http://localhost:5173");
    expect(defaults.DATABASE_URL).toBeDefined();
  });

  it("should reject invalid PORT values (> 65535, negative, non-numeric)", () => {
    const overPort = envSchema.safeParse({ PORT: "70000" });
    expect(overPort.success).toBe(false);

    const negativePort = envSchema.safeParse({ PORT: "-5" });
    expect(negativePort.success).toBe(false);

    const notNumberPort = envSchema.safeParse({ PORT: "abc" });
    expect(notNumberPort.success).toBe(false);
  });

  it("should reject invalid DATABASE_URL schemes (e.g. mysql, invalid string)", () => {
    const mysqlDb = envSchema.safeParse({
      DATABASE_URL: "mysql://user:pass@localhost:3306/db",
    });
    expect(mysqlDb.success).toBe(false);

    const invalidUrl = envSchema.safeParse({
      DATABASE_URL: "not-a-db-url",
    });
    expect(invalidUrl.success).toBe(false);
  });

  it("should reject invalid MIGRATION_DATABASE_URL schemes", () => {
    const badMigrationUrl = envSchema.safeParse({
      MIGRATION_DATABASE_URL: "sqlite://file.db",
    });
    expect(badMigrationUrl.success).toBe(false);
  });

  it("should format validation errors clearly without leaking raw values", () => {
    const result = envSchema.safeParse({
      PORT: "99999",
      FRONTEND_URL: "not_a_valid_url",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = (result.error as any).issues || [];
      const formatted = formatEnvErrors(issues);

      expect(formatted).toContain("Environment configuration validation failed:");
      expect(formatted).toContain("[PORT]");
      expect(formatted).toContain("[FRONTEND_URL]");
      expect(formatted).not.toContain("password");
    }
  });
});
