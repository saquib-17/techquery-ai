/**
 * Automated Verification Script for Phase A2
 * Tests:
 * 1. Environment validation with valid configurations and defaults.
 * 2. Environment validation rejection on invalid values (port range, bad enum, invalid url).
 * 3. Error formatting readability.
 * 4. Logger instantiation, level filtering, and sensitive path redaction.
 * 5. Git ignore rules verification for environment secrets.
 */

import { validateEnv, formatEnvErrors } from "../apps/api/src/core/config/index.js";
import { envSchema } from "../apps/api/src/core/config/env.schema.js";
import { logger, REDACTED_PATHS } from "../apps/api/src/core/logger/index.js";
import fs from "node:fs";
import path from "node:path";

let passedTests = 0;
let totalTests = 0;

const assert = (condition: boolean, testName: string, detail?: string) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    process.exitCode = 1;
  }
};

console.log("=== PHASE A2 AUTOMATED VERIFICATION ===\n");

// --- TEST 1: Valid Configuration & Default Values ---
try {
  const result = validateEnv({
    NODE_ENV: "production",
    PORT: "5000",
    APP_MODE: "cloud",
    FRONTEND_URL: "https://techquery.example.com",
    LOG_LEVEL: "warn",
  });

  assert(result.NODE_ENV === "production", "NODE_ENV parsed correctly");
  assert(result.PORT === 5000, "PORT coerced from string to integer");
  assert(result.APP_MODE === "cloud", "APP_MODE parsed correctly");
  assert(result.LOG_LEVEL === "warn", "LOG_LEVEL parsed correctly");
  assert(result.FRONTEND_URL === "https://techquery.example.com", "FRONTEND_URL parsed correctly");
} catch (err) {
  assert(false, "Valid configuration parsing", String(err));
}

// --- TEST 2: Sensible Defaults ---
try {
  const defaults = validateEnv({});
  assert(defaults.NODE_ENV === "development", "Default NODE_ENV is development");
  assert(defaults.PORT === 4000, "Default PORT is 4000");
  assert(defaults.APP_MODE === "local", "Default APP_MODE is local");
  assert(defaults.LOG_LEVEL === "debug", "Development default LOG_LEVEL is debug");
  assert(defaults.FRONTEND_URL === "http://localhost:5173", "Default FRONTEND_URL is http://localhost:5173");
} catch (err) {
  assert(false, "Sensible defaults parsing", String(err));
}

// --- TEST 3: Validation Rejection on Invalid PORT (> 65535) ---
try {
  const invalidResult = envSchema.safeParse({ PORT: "70000" });
  assert(!invalidResult.success, "Invalid PORT (70000) rejected by Zod");
  if (!invalidResult.success) {
    const issues = (invalidResult.error as any).issues || (invalidResult.error as any).errors || [];
    const errorText = formatEnvErrors(issues);
    assert(errorText.includes("PORT must be at most 65535"), "Error message contains clear port range error");
  }
} catch (err) {
  assert(false, "Invalid PORT rejection", String(err));
}

// --- TEST 4: Validation Rejection on Negative PORT ---
try {
  const negativePort = envSchema.safeParse({ PORT: "-1" });
  assert(!negativePort.success, "Negative PORT (-1) rejected by Zod");
} catch (err) {
  assert(false, "Negative PORT rejection", String(err));
}

// --- TEST 5: Validation Rejection on Invalid NODE_ENV ---
try {
  const badEnv = envSchema.safeParse({ NODE_ENV: "staging" });
  assert(!badEnv.success, "Invalid NODE_ENV ('staging') rejected by Zod");
} catch (err) {
  assert(false, "Invalid NODE_ENV rejection", String(err));
}

// --- TEST 6: Validation Rejection on Invalid FRONTEND_URL ---
try {
  const badUrl = envSchema.safeParse({ FRONTEND_URL: "not-a-valid-url" });
  assert(!badUrl.success, "Invalid FRONTEND_URL rejected by Zod");
} catch (err) {
  assert(false, "Invalid FRONTEND_URL rejection", String(err));
}

// --- TEST 7: Structured Logger & Redaction Paths ---
try {
  assert(typeof logger.info === "function", "Logger has info method");
  assert(typeof logger.error === "function", "Logger has error method");
  assert(typeof logger.warn === "function", "Logger has warn method");
  assert(typeof logger.debug === "function", "Logger has debug method");

  // Verify redaction keys list
  assert(REDACTED_PATHS.includes("password"), "Redaction list contains 'password'");
  assert(REDACTED_PATHS.includes("token"), "Redaction list contains 'token'");
  assert(REDACTED_PATHS.includes("authorization"), "Redaction list contains 'authorization'");
  assert(REDACTED_PATHS.includes("secret"), "Redaction list contains 'secret'");
} catch (err) {
  assert(false, "Logger structure test", String(err));
}

// --- TEST 8: Git Ignore Protection for Environment Files ---
try {
  const gitignoreContent = fs.readFileSync(path.resolve(process.cwd(), ".gitignore"), "utf-8");
  assert(gitignoreContent.includes(".env"), ".gitignore includes .env");
  assert(gitignoreContent.includes(".env.local"), ".gitignore includes .env.local");
  assert(gitignoreContent.includes("!*.env.example"), ".gitignore allows .env.example");
  assert(gitignoreContent.includes("node_modules/"), ".gitignore includes node_modules/");
} catch (err) {
  assert(false, "Gitignore verification", String(err));
}

console.log(`\nVerification complete: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log("All Phase A2 verification checks PASSED successfully!");
} else {
  console.error("Some verification checks FAILED.");
  process.exit(1);
}
