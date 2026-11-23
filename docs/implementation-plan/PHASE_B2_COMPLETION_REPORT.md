# Phase B2 Completion Report — User Registration & Email Verification

**Phase:** B2  
**Milestone:** User Registration & Email Verification  
**Status:** Complete & Fully Verified  
**Date:** 2026-11-23  
**Auditor / Engineer:** Principal Software Architect & Senior Backend Engineer  

---

## 1. Executive Summary

Phase B2 delivers a secure, production-grade candidate registration and email verification foundation for TechQuery AI. The implementation strictly adheres to the approved Modular Monolith architecture, utilizing Express 5, Prisma ORM, PostgreSQL least-privilege roles, native Argon2id password hashing, Zod schema validation, and Pino structured logging.

Key accomplishments:
1. **Zod Registration & Verification Schemas:**
   - Enforced strict normalization (lowercased, trimmed emails).
   - Validated name bounds (2–100 chars, trimmed).
   - Enforced strict password complexity rules (8–128 characters with at least one uppercase letter, one lowercase letter, one number, and one special symbol).
   - Enforced strict schema checking (`.strict()`) to prevent privilege escalation or mass-assignment attacks (e.g. attempting to submit `role: "ADMIN"`).
2. **EmailVerificationToken Entity & Database Migration:**
   - Introduced `EmailVerificationToken` table with primary key `id`, user foreign key with cascade deletion (`ON DELETE CASCADE`), unique `token_hash`, single-use flag `is_used`, and expiration timestamp `expires_at`.
   - Applied migration `20261123222530_email_verification_tokens` to both `techquery_dev` and `techquery_test` via `techquery_migrator` (DDL role).
   - Granted explicit `SELECT, INSERT, UPDATE, DELETE` to `techquery_runtime` (DML role) while verifying DDL remains strictly blocked (PostgreSQL error 42501).
3. **Cryptographic Token Service (`EmailVerificationTokenService`):**
   - Generates 32-byte cryptographically secure random tokens (64-character hex strings).
   - Hashes tokens with SHA-256 before storage in PostgreSQL; plaintext tokens are never stored in the database.
   - Provides timing-safe comparison (`crypto.timingSafeEqual`) to prevent side-channel timing attacks.
4. **Zero-Cost Email Delivery Abstraction (`EmailService`):**
   - Implemented an abstracted `IEmailService` interface adhering to the ₹0 total-cost mandate.
   - Local / Development mode: Generates the verification URL and prints it in stdout using Pino structured logging for instant, friction-free local verification.
   - Production mode: Documents limitations and no-ops gracefully without exposing credentials or throwing 500 errors when no external provider is configured.
5. **Endpoints Implemented (`/api/v1/auth`):**
   - `POST /api/v1/auth/register`: Creates candidate account with `role=CANDIDATE`, `tier=FREE`, `isVerified=false`, hashes password via Argon2id, generates verification token, and stores token hash atomically in a database transaction (`prisma.$transaction`). Handles race conditions via Prisma unique constraint `P2002` returning `409 EMAIL_ALREADY_EXISTS`. Never leaks password hashes.
   - `POST /api/v1/auth/verify-email`: Accepts 64-character verification token, validates expiration and single-use state, and atomically marks the token used and the user verified.
   - `POST /api/v1/auth/resend-verification`: Accepts email, invalidates prior active tokens, generates a new token, and enforces an in-memory sliding window rate limiter (max 3 resends per 15 minutes per email). Returns a uniform generic success message to prevent user enumeration attacks.
6. **Automated Testing & Regressions:**
   - Added 4 unit tests in `tests/unit/token.service.test.ts`.
   - Added 15 integration tests in `tests/integration/auth-registration.test.ts`.
   - Total test suite: **69/69 tests passed** across 11 test files.
   - Overall test coverage: **94.75% Statements, 91.56% Branches, 97.43% Functions, 94.75% Lines**.
   - Verified that all previous regression suites (`verify-a2.ts`, `verify-a3.ts`, `verify-a3-1.ts`, `verify-a4.ts`) remain 100% passing.
   - Clean build and typecheck (`0 errors`). Zero Git commits created.

---

## 2. API Endpoint Specification

### 2.1 Register User
- **Method & Route:** `POST /api/v1/auth/register`
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Jane Candidate",
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "23faef66-3d77-4be7-a9a3-5a0ec7b94cf7",
        "email": "jane@example.com",
        "name": "Jane Candidate",
        "role": "CANDIDATE",
        "tier": "FREE",
        "isVerified": false,
        "createdAt": "2026-11-23T22:30:00.000Z",
        "updatedAt": "2026-11-23T22:30:00.000Z"
      },
      "message": "Account created successfully. Please verify your email address.",
      "verificationUrl": "http://localhost:5173/verify-email?token=..." // Non-production only
    }
  }
  ```
- **Error Responses:**
  - `400 VALIDATION_ERROR`: Field validation failure (e.g. invalid email format, weak password, missing fields, or unrecognized attributes).
  - `409 EMAIL_ALREADY_EXISTS`: An account with this email is already registered.

### 2.2 Verify Email Address
- **Method & Route:** `POST /api/v1/auth/verify-email`
- **Request Body:**
  ```json
  {
    "token": "1f171dc897a79cbd8bda836b08b0ac38b2fe21d1e38a9af30f494aa945d8ec93"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Email address verified successfully",
      "user": {
        "id": "23faef66-3d77-4be7-a9a3-5a0ec7b94cf7",
        "email": "jane@example.com",
        "name": "Jane Candidate",
        "role": "CANDIDATE",
        "tier": "FREE",
        "isVerified": true,
        "createdAt": "2026-11-23T22:30:00.000Z",
        "updatedAt": "2026-11-23T22:30:00.000Z"
      }
    }
  }
  ```
- **Error Responses:**
  - `400 BAD_REQUEST`: Token is invalid, expired, or has already been used.

### 2.3 Resend Verification Email
- **Method & Route:** `POST /api/v1/auth/resend-verification`
- **Request Body:**
  ```json
  {
    "email": "jane@example.com"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "If an unverified account with this email exists, a new verification link has been sent."
    }
  }
  ```
- **Error Responses:**
  - `400 BAD_REQUEST`: Exceeded rate limit (max 3 resend requests per 15 minutes per email).

---

## 3. Database Schema & Migration Details

### 3.1 Model Definition (`apps/api/prisma/schema.prisma`)
```prisma
model EmailVerificationToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash")
  expiresAt DateTime @map("expires_at")
  isUsed    Boolean  @default(false) @map("is_used")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("email_verification_tokens")
}
```

### 3.2 SQL Migration (`20261123222530_email_verification_tokens`)
```sql
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 4. Security Controls & Zero-Cost Architecture

1. **No Plaintext Token Storage:** Tokens are generated as 32-byte cryptographic random strings and stored only as SHA-256 hashes.
2. **Timing Attack Defense:** Token matching uses SHA-256 lookups on the unique `token_hash` index and constant-time buffer comparison.
3. **Single-Use Enforcement:** Tokens are consumed atomically within a transaction (`is_used = true`). Reused or expired tokens are rejected.
4. **Token Invalidation on Resend:** Requesting a new verification token automatically invalidates all previous active tokens for that user ID.
5. **Anti-Enumeration Protection:** The resend endpoint returns a uniform generic message regardless of whether the email exists or is already verified.
6. **In-Memory Abuse Throttling:** Sliding-window rate limiting prevents email spamming or server load without requiring Redis or third-party paid services.
7. **Production Sanitization:** Verification URLs and token links are never returned in production API payloads or leaked into production logs.
8. **Role Least-Privilege:** Runtime role `techquery_runtime` is restricted to `SELECT, INSERT, UPDATE, DELETE` on `email_verification_tokens`; DDL attempts return PostgreSQL error 42501.

---

## 5. Automated Test Results

### 5.1 Test Suites Summary
```text
Test Files  11 passed (11)
     Tests  69 passed (69)
```

### 5.2 Test Breakdown
- **Unit Tests:**
  - `token.service.test.ts`: 4 tests (cryptographic randomness, SHA-256 consistency, error handling, timing-safe equality)
  - `password.service.test.ts`: 8 tests (Argon2id hashing, salting, bounds checking, parameter security)
  - `env.test.ts`: 6 tests
  - `logger.test.ts`: 2 tests
  - `AppError.test.ts`: 6 tests
  - `responses.test.ts`: 2 tests
- **Integration Tests:**
  - `auth-registration.test.ts`: 15 tests (registration success, Argon2id verification, unique email handling, invalid email/password rejection, strict field rejection, email verification, token expiration, single-use reuse rejection, token hash verification, resend invalidation, anti-enumeration, rate limiting)
  - `auth-models.test.ts`: 5 tests
  - `database.test.ts`: 8 tests
  - `health.test.ts`: 4 tests
  - `middleware.test.ts`: 9 tests

### 5.3 Code Coverage
```text
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   94.75 |    91.56 |   97.43 |   94.75 |                   
 src               |     100 |      100 |     100 |     100 |                   
  app.ts           |     100 |      100 |     100 |     100 |                   
 src/core/config   |     100 |       80 |     100 |     100 |                   
  env.schema.ts    |     100 |       80 |     100 |     100 | 53                
 src/core/email    |   85.71 |       50 |     100 |   85.71 |                   
  email.service.ts |   85.71 |       50 |     100 |   85.71 | 48-52             
 src/core/errors   |     100 |    86.27 |     100 |     100 |                   
  AppError.ts      |     100 |      100 |     100 |     100 |                   
  errorHandler.ts  |     100 |    82.14 |     100 |     100 | 45-53             
 src/core/security |   93.93 |    93.75 |     100 |   93.93 |                   
  ...rd.service.ts |   94.11 |    94.73 |     100 |   94.11 | 38-40             
  token.service.ts |   93.54 |     92.3 |     100 |   93.54 | 51-52             
 src/modules/auth  |   87.89 |    89.58 |   94.11 |   87.89 |                   
  ...controller.ts |   78.57 |     87.5 |     100 |   78.57 | 38-43,59-64       
  ...repository.ts |   94.73 |      100 |   85.71 |   94.73 | 18-21             
  auth.routes.ts   |     100 |      100 |     100 |     100 |                   
  auth.schemas.ts  |     100 |      100 |     100 |     100 |                   
  auth.service.ts  |   84.28 |     87.5 |     100 |   84.28 | ...11-125,166-167 
 ...modules/health |     100 |      100 |     100 |     100 |                   
  ...controller.ts |     100 |      100 |     100 |     100 |                   
  health.routes.ts |     100 |      100 |     100 |     100 |                   
-------------------|---------|----------|---------|---------|-------------------
```

### 5.4 Regression Suite Execution
- `verify-a2.ts`: 27/27 PASS
- `verify-a3.ts`: 17/17 PASS
- `verify-a3-1.ts`: 18/18 PASS
- `verify-a4.ts`: 37/37 PASS
- `npm run typecheck`: 0 errors
- `npm run build`: 0 errors

---

## 6. Zero-Cost Limitations & Boundaries

1. **Email Provider Absence in Production:** Production environments currently log a warning when no external email provider is configured. The architecture includes an abstracted interface ready for Resend Free Tier integration (100 emails/day, 3,000/month free) in Phase B4.
2. **Rate Limiting Persistence:** The current rate limiter for resending verification emails uses an in-memory map. It satisfies zero-cost local operation without Redis. In multi-instance deployments, distributed rate limiting would require database-backed throttling or Redis.
3. **Deferred Authentication Features:** Login (`POST /api/v1/auth/login`), JWT access token generation, and Refresh Token Rotation are reserved for Phase B3.
