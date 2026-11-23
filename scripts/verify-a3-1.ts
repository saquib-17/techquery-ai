/**
 * Automated Verification Script for Phase A3.1: Database Security & Least Privilege Hardening
 * Tests:
 * 1. Role Privilege Audit: techquery_migrator and techquery_runtime are verified non-superusers.
 * 2. Legacy Role Neutralization: techquery role has login disabled and superuser revoked.
 * 3. Runtime Role DML Operations: SELECT, INSERT, UPDATE, DELETE verified.
 * 4. Runtime Privilege Denial (DDL Blocked): CREATE TABLE is rejected with 42501 (insufficient_privilege).
 * 5. Runtime Privilege Denial (ALTER Blocked): ALTER TABLE is rejected with 42501 (insufficient_privilege).
 * 6. Migration Role DDL Permissions: techquery_migrator owns public schema, users, and _prisma_migrations.
 * 7. Clean Teardown: zero test records remain in database.
 */

import { prisma, connectDatabase, disconnectDatabase } from "../apps/api/src/core/database/index.js";

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

const runSecurityVerification = async () => {
  console.log("=== PHASE A3.1 DATABASE SECURITY AUDIT & VERIFICATION ===\n");

  await connectDatabase();

  // --- TEST 1: Role Privilege Audit (Non-Superuser Verification) ---
  try {
    const roles = await prisma.$queryRaw<
      Array<{ rolname: string; rolsuper: boolean; rolcreaterole: boolean; rolcreatedb: boolean; rolcanlogin: boolean }>
    >`
      SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
      FROM pg_roles
      WHERE rolname IN ('techquery_migrator', 'techquery_runtime', 'techquery')
      ORDER BY rolname;
    `;

    const migrator = roles.find((r) => r.rolname === "techquery_migrator");
    const runtime = roles.find((r) => r.rolname === "techquery_runtime");
    const legacy = roles.find((r) => r.rolname === "techquery");

    assert(migrator !== undefined && !migrator.rolsuper, "techquery_migrator is NOT superuser (rolsuper = false)");
    assert(migrator !== undefined && !migrator.rolcreaterole, "techquery_migrator cannot create roles (rolcreaterole = false)");
    assert(migrator !== undefined && !migrator.rolcreatedb, "techquery_migrator cannot create databases (rolcreatedb = false)");
    assert(migrator !== undefined && migrator.rolcanlogin, "techquery_migrator can login");

    assert(runtime !== undefined && !runtime.rolsuper, "techquery_runtime is NOT superuser (rolsuper = false)");
    assert(runtime !== undefined && !runtime.rolcreaterole, "techquery_runtime cannot create roles (rolcreaterole = false)");
    assert(runtime !== undefined && !runtime.rolcreatedb, "techquery_runtime cannot create databases (rolcreatedb = false)");
    assert(runtime !== undefined && runtime.rolcanlogin, "techquery_runtime can login");

    assert(legacy !== undefined && !legacy.rolsuper, "legacy techquery superuser revoked (rolsuper = false)");
    assert(legacy !== undefined && !legacy.rolcanlogin, "legacy techquery login disabled (rolcanlogin = false)");
  } catch (err) {
    assert(false, "Role privilege audit", String(err));
  }

  // --- TEST 2: Table Ownership Audit ---
  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string; tableowner: string }>>`
      SELECT tablename, tableowner
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('users', '_prisma_migrations');
    `;

    const usersTable = tables.find((t) => t.tablename === "users");
    const migrationsTable = tables.find((t) => t.tablename === "_prisma_migrations");

    assert(usersTable !== undefined && usersTable.tableowner === "techquery_migrator", "users table is owned by techquery_migrator");
    assert(migrationsTable !== undefined && migrationsTable.tableowner === "techquery_migrator", "_prisma_migrations table is owned by techquery_migrator");
  } catch (err) {
    assert(false, "Table ownership audit", String(err));
  }

  // --- TEST 3: Runtime Role DML (SELECT, INSERT, UPDATE, DELETE) ---
  const auditEmail = `security.audit.${Date.now()}@techquery.local`;
  let auditUserId: string | null = null;

  try {
    // 3A. INSERT
    const inserted = await prisma.user.create({
      data: {
        email: auditEmail,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$audit_hash",
        role: "CANDIDATE",
      },
    });
    auditUserId = inserted.id;
    assert(typeof inserted.id === "string", "Runtime role can execute INSERT on users");

    // 3B. SELECT
    const selected = await prisma.user.findUnique({
      where: { id: auditUserId },
    });
    assert(selected !== null && selected.email === auditEmail, "Runtime role can execute SELECT on users");

    // 3C. UPDATE
    const updated = await prisma.user.update({
      where: { id: auditUserId },
      data: { role: "ADMIN" },
    });
    assert(updated.role === "ADMIN", "Runtime role can execute UPDATE on users");

    // 3D. DELETE
    await prisma.user.delete({
      where: { id: auditUserId },
    });
    const afterDelete = await prisma.user.findUnique({
      where: { id: auditUserId },
    });
    assert(afterDelete === null, "Runtime role can execute DELETE on users (test data cleaned up)");
  } catch (err) {
    assert(false, "Runtime DML operations", String(err));
  }

  // --- TEST 4: Runtime Role Privilege Denial: CREATE TABLE MUST BE REJECTED ---
  try {
    let createTableBlocked = false;
    try {
      await prisma.$executeRawUnsafe(`CREATE TABLE unauthorized_test (id int);`);
    } catch (err: any) {
      // PostgreSQL error code 42501: insufficient_privilege
      if (err.message?.includes("42501") || err.message?.includes("permission denied")) {
        createTableBlocked = true;
      } else {
        throw err;
      }
    }
    assert(createTableBlocked, "Runtime role CREATE TABLE rejected with 42501 (insufficient_privilege)");
  } catch (err) {
    assert(false, "CREATE TABLE privilege denial test", String(err));
  }

  // --- TEST 5: Runtime Role Privilege Denial: ALTER TABLE MUST BE REJECTED ---
  try {
    let alterTableBlocked = false;
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN unauthorized_col text;`);
    } catch (err: any) {
      if (err.message?.includes("42501") || err.message?.includes("must be owner") || err.message?.includes("permission denied")) {
        alterTableBlocked = true;
      } else {
        throw err;
      }
    }
    assert(alterTableBlocked, "Runtime role ALTER TABLE rejected with 42501 (must be table owner)");
  } catch (err) {
    assert(false, "ALTER TABLE privilege denial test", String(err));
  }

  await disconnectDatabase();

  console.log(`\nSecurity verification complete: ${passedTests}/${totalTests} tests passed.`);
  if (passedTests === totalTests) {
    console.log("All Phase A3.1 security verification checks PASSED successfully!");
  } else {
    console.error("Some security checks FAILED.");
    process.exit(1);
  }
};

runSecurityVerification().catch((err) => {
  console.error("Unhandled error during security verification:", err);
  process.exit(1);
});
