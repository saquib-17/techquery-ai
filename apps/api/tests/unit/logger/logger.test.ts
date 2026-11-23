import { describe, it, expect } from "vitest";
import { REDACTED_PATHS } from "../../../src/core/logger/index.js";
import pino from "pino";

describe("Logger Security & Redaction Unit Tests", () => {
  it("should maintain all mandatory credential and token redaction paths", () => {
    const expectedKeys = [
      "password",
      "token",
      "refreshToken",
      "accessToken",
      "authorization",
      "cookie",
      "DATABASE_URL",
      "MIGRATION_DATABASE_URL",
      "secret",
      "jwtSecret",
    ];

    for (const key of expectedKeys) {
      expect(REDACTED_PATHS).toContain(key);
    }
  });

  it("should actively redact sensitive fields in logged JSON output", () => {
    let capturedLog = "";
    const testDestination = {
      write: (chunk: string) => {
        capturedLog += chunk;
      },
    };

    const testLogger = pino(
      {
        level: "info",
        redact: {
          paths: REDACTED_PATHS,
          censor: "[REDACTED]",
        },
      },
      testDestination
    );

    testLogger.info({
      user: "test-user",
      password: "sensitive_plain_password_123",
      token: "jwt_raw_secret_token",
      DATABASE_URL: "postgresql://techquery_runtime:super_secret@localhost:5432/db",
      nested: {
        refreshToken: "refresh_secret_abc",
        secret: "internal_api_secret",
      },
    });

    const parsedLog = JSON.parse(capturedLog);

    expect(parsedLog.password).toBe("[REDACTED]");
    expect(parsedLog.token).toBe("[REDACTED]");
    expect(parsedLog.DATABASE_URL).toBe("[REDACTED]");
    expect(parsedLog.nested.refreshToken).toBe("[REDACTED]");
    expect(parsedLog.nested.secret).toBe("[REDACTED]");

    expect(capturedLog).not.toContain("sensitive_plain_password_123");
    expect(capturedLog).not.toContain("jwt_raw_secret_token");
    expect(capturedLog).not.toContain("super_secret");
    expect(capturedLog).not.toContain("refresh_secret_abc");
    expect(capturedLog).not.toContain("internal_api_secret");
  });
});
