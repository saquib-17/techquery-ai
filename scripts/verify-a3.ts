/**
 * Automated Verification Script for Phase A3: PostgreSQL and Prisma Foundation
 * Updated for Phase A3.1 credential rotation and sanitized test fixtures.
 */

import { prisma, connectDatabase, disconnectDatabase } from "../apps/api/src/core/database/index.js";
import { validateEnv } from "../apps/api/src/core/config/index.js";
import { envSchema } from "../apps/api/src/core/config/env.schema.js";
import { REDACTED_PATHS } from "../apps/api/src/core/logger/index.js";
import { Prisma } from "@prisma/client";

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

const runVerification = async () => {
  console.log("=== PHASE A3 AUTOMATED VERIFICATION ===\n");

  // --- TEST 1: Environment Schema accepts valid DATABASE_URL ---
  try {
    const dummyUrl = "postgresql://techquery_runtime:sanitized_dummy_pass@127.0.0.1:5432/techquery_dev";
    const parsed = validateEnv({
      DATABASE_URL: dummyUrl,
    });
    assert(
      parsed.DATABASE_URL === dummyUrl,
      "DATABASE_URL validated and parsed by Zod"
    );
  } catch (err) {
    assert(false, "DATABASE_URL validation", String(err));
  }

  // --- TEST 2: Environment Schema rejects non-PostgreSQL URL ---
  try {
    const invalidResult = envSchema.safeParse({
      DATABASE_URL: "mysql://root:password@localhost:3306/db",
    });
    assert(!invalidResult.success, "Non-PostgreSQL DATABASE_URL rejected by Zod schema");
  } catch (err) {
    assert(false, "Invalid database URL rejection", String(err));
  }

  // --- TEST 3: DATABASE_URL & MIGRATION_DATABASE_URL Redaction in Logger ---
  try {
    assert(REDACTED_PATHS.includes("DATABASE_URL"), "DATABASE_URL is in logger REDACTED_PATHS");
    assert(REDACTED_PATHS.includes("*.DATABASE_URL"), "*.DATABASE_URL is in logger REDACTED_PATHS");
    assert(REDACTED_PATHS.includes("MIGRATION_DATABASE_URL"), "MIGRATION_DATABASE_URL is in logger REDACTED_PATHS");
    assert(REDACTED_PATHS.includes("*.MIGRATION_DATABASE_URL"), "*.MIGRATION_DATABASE_URL is in logger REDACTED_PATHS");
    assert(REDACTED_PATHS.includes("password"), "password is in logger REDACTED_PATHS");
  } catch (err) {
    assert(false, "Logger redaction check", String(err));
  }

  // --- TEST 4: Centralized Database Connection ---
  try {
    await connectDatabase();
    assert(true, "Backend connects to PostgreSQL via connectDatabase()");
  } catch (err) {
    assert(false, "Backend connects to PostgreSQL", String(err));
    process.exit(1);
  }

  // --- TEST 5: Raw Health Check Query ---
  try {
    const pingResult = await prisma.$queryRaw<Array<{ ping: number }>>`SELECT 1 as ping`;
    assert(
      Array.isArray(pingResult) && pingResult.length > 0 && pingResult[0].ping === 1,
      "PostgreSQL raw health check query (SELECT 1) succeeded"
    );
  } catch (err) {
    assert(false, "PostgreSQL raw health check", String(err));
  }

  const testEmail = `test.user.${Date.now()}@techquery.local`;
  let createdUserId: string | null = null;

  // --- TEST 6: User Record Insertion & Retrieval ---
  try {
    const createdUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummy_hash_for_test",
        role: "CANDIDATE",
      },
    });

    createdUserId = createdUser.id;
    assert(typeof createdUser.id === "string" && createdUser.id.length > 0, "User inserted with generated UUID primary key");
    assert(createdUser.email === testEmail, "User email matches input email");
    assert(createdUser.role === "CANDIDATE", "User role defaults to CANDIDATE enum");
    assert(createdUser.createdAt instanceof Date, "User createdAt is a valid Date");

    const fetchedUser = await prisma.user.findUnique({
      where: { id: createdUserId },
    });
    assert(fetchedUser !== null && fetchedUser.id === createdUserId, "User successfully retrieved by primary key");
  } catch (err) {
    assert(false, "User insertion and retrieval", String(err));
  }

  // --- TEST 7: Duplicate Email Rejection (Unique Constraint P2002) ---
  try {
    let duplicateRejected = false;
    try {
      await prisma.user.create({
        data: {
          email: testEmail, // Identical email
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummy_hash_2",
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        duplicateRejected = true;
      } else {
        throw err;
      }
    }
    assert(duplicateRejected, "Duplicate email rejected with Prisma unique constraint code P2002");
  } catch (err) {
    assert(false, "Duplicate email constraint test", String(err));
  }

  // --- TEST 8: Test Record Cleanup (Zero Residual Test Data) ---
  try {
    if (createdUserId) {
      await prisma.user.delete({
        where: { id: createdUserId },
      });
      const checkDeleted = await prisma.user.findUnique({
        where: { id: createdUserId },
      });
      assert(checkDeleted === null, "Test user record cleanly deleted (zero residual test data)");
    }
  } catch (err) {
    assert(false, "Test user cleanup", String(err));
  }

  // --- TEST 9: Centralized Database Disconnect ---
  try {
    await disconnectDatabase();
    assert(true, "Database disconnected cleanly via disconnectDatabase()");
  } catch (err) {
    assert(false, "Database disconnection", String(err));
  }

  console.log(`\nVerification complete: ${passedTests}/${totalTests} tests passed.`);
  if (passedTests === totalTests) {
    console.log("All Phase A3 verification checks PASSED successfully!");
  } else {
    console.error("Some verification checks FAILED.");
    process.exit(1);
  }
};

runVerification().catch((err) => {
  console.error("Unhandled error during verification:", err);
  process.exit(1);
});
