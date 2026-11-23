# TechQuery AI — Definition of Done (DoD)

## Document Overview
This document specifies the formal, non-negotiable **Definition of Done (DoD)** across multiple engineering layers for TechQuery AI. An engineering item is strictly marked "Done" only when all criteria in its corresponding tier are verified and passing.

---

## 1. Task-Level Definition of Done (Backend & Frontend)

A single developer task or pull request is Done when:
1. **TypeScript Strictness:** Code compiles with `tsc --noEmit` without errors, warnings, or `@ts-ignore` overrides.
2. **Linting & Formatting:** Code adheres to ESLint and Prettier rules; `npm run lint` passes with zero violations.
3. **Unit Test Coverage:** All newly introduced domain logic functions have accompanying Vitest unit tests with >= 85% branch coverage.
4. **No Console Chatter:** Debug logs, temporary `console.log()` statements, and commented-out code blocks are removed.
5. **No Secret Leaks:** No API keys, passwords, connection strings, or personal test data are committed.
6. **Documentation Updated:** JSDoc annotations provided on exported interfaces and service methods.

---

## 2. Database Migration Definition of Done

A database schema change or migration is Done when:
1. **Prisma Generation:** Generated via `npx prisma migrate dev --name <descriptive_name>` and committed to `prisma/migrations/`.
2. **Deterministic SQL:** Migration executes cleanly against an empty PostgreSQL database instance.
3. **ForeignKey Indexing:** All foreign key columns have explicit indexes declared in `schema.prisma`.
4. **Idempotent Seed Compatibility:** `prisma/seeds/seed.ts` executes successfully post-migration without constraint violations.
5. **No Production Reset Required:** Migration is additive or non-destructive; runs safely via `prisma migrate deploy`.

---

## 3. API Endpoint Definition of Done

An API endpoint is Done when:
1. **OpenAPI Specification Match:** Endpoint path, method, headers, request body, and responses match `openapi.yaml`.
2. **Zod Input Validation:** Request `body`, `query`, and `params` are validated using Zod middleware before reaching the controller.
3. **Tenant Ownership Protection:** BOLA/IDOR protection is enforced; parameterized routes verify that the target resource belongs to `req.user.id`.
4. **Standard Envelopes:** Returns standard `{ success: true, data: ... }` on success and `{ success: false, error: ... }` on error.
5. **Integration Test Suite:** Supertest integration tests cover:
   - Happy path (200/201).
   - Validation failure (400/422).
   - Unauthenticated access (401).
   - Cross-tenant unauthorized access (403).

---

## 4. AI Gateway Integration Definition of Done

An AI-driven feature or prompt is Done when:
1. **Provider Independence:** Executes seamlessly through the `AIGatewayProvider` interface without direct coupling to Ollama or Groq.
2. **Strict Zod Output Validation:** LLM output string is parsed and validated against an explicit Zod schema.
3. **Auto-Repair Capability:** Single-turn repair prompt implemented to recover from minor formatting errors.
4. **Offline Fallback Guarantee:** Feature does not crash if the LLM is unreachable; deterministic fallback or user-friendly error is returned.
5. **Mock Test Fixtures:** Deterministic unit tests written using `MockDriver` without making live API network calls.

---

## 5. Phase Milestone Definition of Done

A development phase (e.g., Phase D, Phase G) is Done when:
1. **All Phase Tasks Complete:** Every task in the phase reaches Task-Level DoD.
2. **Phase Integration Tests Pass:** Multi-module interactions within the phase execute cleanly.
3. **Regression Suite Green:** All existing tests from preceding phases continue to pass 100%.
4. **Demo Readiness:** Phase capabilities are demonstrable via API or UI harness without manual database hacking.

---

## 6. V1 Release Gate Definition of Done

TechQuery AI V1 is declared ready for MCA placement demonstrations when:
1. **₹0 Cost Verification:** System operates in both Mode A (Local Docker) and Mode B (Free Cloud) without incurring any financial charges or requiring paid credits.
2. **Zero Critical Vulnerabilities:** `npm audit` reports zero high or critical security advisories.
3. **E2E User Journey Verification:** Playwright automated test suite passes the complete end-to-end journey from user signup to PDF export.
4. **Cold-Start Resilience:** Frontend detects backend cold-starts (>15s delay) and displays informative user feedback rather than blank screen crashes.
5. **Demo Seed Account:** Seed script creates a fully preloaded demo account (`demo@techquery.local`) capable of instant presentation.
