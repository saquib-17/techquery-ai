# TechQuery AI — Phase A3.1: Database Security Hardening & Least Privilege Report

## Document Overview
This report documents the security remediation, credential rotation, and least-privilege role separation executed for TechQuery AI following the Phase A3 database baseline. All superuser privileges have been revoked, credentials rotated, roles partitioned into migration and runtime responsibilities, and automated privilege-denial tests verified.

---

## 1. Executive Summary & Changes Performed

| Security Dimension | Prior State (A3) | Remediation Applied (A3.1) | Status |
| :--- | :--- | :--- | :---: |
| **Database Superuser Access** | Role `techquery` possessed `SUPERUSER` privileges (`rolsuper = true`). | `SUPERUSER` revoked. All application operations moved to dedicated non-superuser roles. | **REMEDIATED** |
| **Credential Exposure** | A default password was documented in a previous report. | Treated as compromised. Generated high-entropy cryptographic secrets stored strictly in ignored `.env` files. | **ROTATED** |
| **Role Separation** | Single database role for both schema changes and application queries. | Split into `techquery_migrator` (DDL only) and `techquery_runtime` (restricted DML only). | **ENFORCED** |
| **DDL Protection at Runtime** | Application connection could execute `CREATE`, `DROP`, or `ALTER TABLE`. | Runtime role explicitly denied schema creation (`REVOKE CREATE ON SCHEMA public`). | **VERIFIED** |
| **Connection String Redaction** | Logging redacted `DATABASE_URL` only. | Extended Pino logger and Zod environment schema to cover `MIGRATION_DATABASE_URL`. | **HARDENED** |
| **Data & Migration Preservation** | N/A | Existing databases (`techquery_dev`, `techquery_test`), tables (`users`), and migration history preserved 100%. | **PRESERVED** |

---

## 2. Database Role Privilege Matrix

PostgreSQL roles were configured with strict least-privilege principles:

| Role Name | Superuser? | Create DB? | Create Role? | Can Login? | Permitted Operations | Denied Operations |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **`techquery_migrator`** | **No** (`false`) | **No** (`false`) | **No** (`false`) | **Yes** (`true`) | `CREATE`, `ALTER`, `DROP` tables, enums, sequences, and indexes in `public` schema; manage `_prisma_migrations`. | Superuser commands, database creation, role creation, operating outside `public` schema. |
| **`techquery_runtime`** | **No** (`false`) | **No** (`false`) | **No** (`false`) | **Yes** (`true`) | `SELECT`, `INSERT`, `UPDATE`, `DELETE` on tables in `public`; sequence usage. | `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, `TRUNCATE`, administrative or maintenance operations. |
| **`techquery`** *(Legacy)* | **No** (`false`) | **No** (`false`) | **No** (`false`) | **No** (`false`) | *None* — Role disabled and locked. | Cannot login (`rolcanlogin = false`), superuser revoked. |

---

## 3. Credential Rotation Confirmation

1. **Compromised Password Neutralization:**
   - The previous default password was revoked across all roles.
   - The legacy `techquery` role was updated with a randomized secret and set to `NOLOGIN`, neutralizing the compromised credential permanently.
2. **Cryptographic Password Generation:**
   - Generated independent high-entropy passwords for `techquery_migrator` and `techquery_runtime` using cryptographically secure pseudorandom generators (`crypto.randomBytes(24)`).
3. **Environment File Isolation:**
   - Rotated connection strings were written directly into `.env` and `apps/api/.env`.
   - Verified that both `.env` files are tracked in `.gitignore` and omitted from Git working tree.
4. **Sanitized Environment Templates:**
   - `.env.example` and `apps/api/.env.example` document both connection URLs with sanitized placeholders:
     - `DATABASE_URL=postgresql://techquery_runtime:<runtime_password>@127.0.0.1:5432/techquery_dev`
     - `MIGRATION_DATABASE_URL=postgresql://techquery_migrator:<migrator_password>@127.0.0.1:5432/techquery_dev`

---

## 4. Migration & Schema Verification Results

- **Prisma Schema Configuration:**
  [`apps/api/prisma/schema.prisma`](file:///f:/techquery-ai-main/apps/api/prisma/schema.prisma) utilizes separate runtime and migration connection targets:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("MIGRATION_DATABASE_URL")
  }
  ```
- **Table Ownership Audit:**
  - Table `users`: Owned by `techquery_migrator`.
  - Table `_prisma_migrations`: Owned by `techquery_migrator`.
  - Enum `Role`: Owned by `techquery_migrator`.
- **Migration Status Check:**
  ```bash
  npx prisma migrate status --schema=apps/api/prisma/schema.prisma
  ```
  - **Output:** `1 migration found in prisma/migrations. Database schema is up to date!`
  - Confirmed existing migration `20261123114537_init_user` remained completely untouched and active.

---

## 5. Runtime CRUD Verification Results

Verified via automated test harness ([`scripts/verify-a3-1.ts`](file:///f:/techquery-ai-main/scripts/verify-a3-1.ts)) using the `techquery_runtime` connection:

1. **INSERT:** Successfully created user record with UUID primary key and default `Role.USER`.
2. **SELECT:** Successfully retrieved user record by ID and verified all fields.
3. **UPDATE:** Successfully updated user role from `USER` to `ADMIN`.
4. **DELETE:** Successfully deleted test user. Verified zero residual records remain in the database.

---

## 6. Privilege-Denial Test Results (Security Hardening Proof)

To verify that the runtime role cannot perform unauthorized schema modifications, automated negative tests were executed:

### Test A: Table Creation Attempt
- **Query:** `CREATE TABLE unauthorized_test (id int);` executed via runtime connection.
- **Expected Outcome:** Denied by PostgreSQL authorization engine.
- **Actual Result:** `Raw query failed. Code: 42501. Message: ERROR: permission denied for schema public`.
- **Verdict:** **PASSED** (Privilege successfully denied).

### Test B: Table Alteration Attempt
- **Query:** `ALTER TABLE users ADD COLUMN unauthorized_col text;` executed via runtime connection.
- **Expected Outcome:** Denied by PostgreSQL authorization engine.
- **Actual Result:** `Raw query failed. Code: 42501. Message: ERROR: must be owner of table users`.
- **Verdict:** **PASSED** (Privilege successfully denied).

---

## 7. Full Regression Results

All verification suites were executed sequentially:

### A. Phase A3.1 Security Verification (`scripts/verify-a3-1.ts`)
- `[PASS] techquery_migrator is NOT superuser (rolsuper = false)`
- `[PASS] techquery_migrator cannot create roles (rolcreaterole = false)`
- `[PASS] techquery_migrator cannot create databases (rolcreatedb = false)`
- `[PASS] techquery_migrator can login`
- `[PASS] techquery_runtime is NOT superuser (rolsuper = false)`
- `[PASS] techquery_runtime cannot create roles (rolcreaterole = false)`
- `[PASS] techquery_runtime cannot create databases (rolcreatedb = false)`
- `[PASS] techquery_runtime can login`
- `[PASS] legacy techquery superuser revoked (rolsuper = false)`
- `[PASS] legacy techquery login disabled (rolcanlogin = false)`
- `[PASS] users table is owned by techquery_migrator`
- `[PASS] _prisma_migrations table is owned by techquery_migrator`
- `[PASS] Runtime role can execute INSERT on users`
- `[PASS] Runtime role can execute SELECT on users`
- `[PASS] Runtime role can execute UPDATE on users`
- `[PASS] Runtime role can execute DELETE on users (test data cleaned up)`
- `[PASS] Runtime role CREATE TABLE rejected with 42501 (insufficient_privilege)`
- `[PASS] Runtime role ALTER TABLE rejected with 42501 (must be table owner)`
- **Total:** **18/18 tests PASSED**.

### B. Phase A3 Database Foundation Verification (`scripts/verify-a3.ts`)
- **Total:** **17/17 tests PASSED**.

### C. Phase A2 Configuration & Logging Verification (`scripts/verify-a2.ts`)
- **Total:** **27/27 tests PASSED**.

### D. TypeScript Strict Typecheck & Compilation
- `npm run typecheck --workspace=@techquery/api`: **0 errors**.
- `npm run build --workspace=@techquery/api`: **0 errors**.

### E. Git Secret Scanning
- `git status --short`: Verified `.env`, `apps/api/.env`, and credentials are strictly ignored. No commits created.

---

## 8. Remaining Issues
**None.** The database configuration now satisfies enterprise least-privilege standards while operating at ₹0 cost on local PostgreSQL.

---

> [!IMPORTANT]
> **PHASE A3.1 COMPLETE.**  
> The database security remediation is verified and sealed. Awaiting explicit founder approval before advancing to **Phase A4 (Express Server, Error Handling & Health Infrastructure)**.
