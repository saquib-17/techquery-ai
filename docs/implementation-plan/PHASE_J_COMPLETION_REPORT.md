# Phase J Completion Report: Candidate Dashboard, Preparation Streaks & Usage Quota Management (Backend Only)

**Status:** Completed  
**Completed Date:** 2026-11-24  
**Workspace:** `F:\techquery-ai-main`  
**Execution Context:** Backend Only (`apps/api`)  

---

## 1. Executive Summary

Phase J delivers a complete candidate preparation analytics and SaaS monetization architecture operating strictly under ₹0 cost:
1. **Candidate Dashboard Engine (`GET /api/v1/dashboard/summary`)**: Aggregates live database portfolio KPIs (resumes, job descriptions, matches, average match score, question sets, questions, answers, and saved collections) strictly scoped to the authenticated candidate.
2. **Preparation Streak Calculator**: A pure, unit-tested engine tracking candidate consistency (`currentStreak`, `longestStreak`, `totalActiveDays`, and `activityMatrix` heatmap) with a graceful daily window (activity yesterday maintains the streak if today's activity is still pending) and calendar day deduplication.
3. **Activity Event Stream (`user_activities`)**: Immutable audit stream capturing candidate actions (`RESUME_UPLOADED`, `JD_ANALYZED`, `MATCH_EVALUATED`, `QUESTIONS_GENERATED`, `ANSWER_GENERATED`, `COLLECTION_CREATED`, `PDF_EXPORTED`, and `TIER_CHANGED`). Safe execution guarantees activity logging never disrupts primary transactions.
4. **PostgreSQL-Backed Free vs. Pro Quota Enforcement**:
   - Zero-Redis, zero-external-dependency quota tracking via PostgreSQL Prisma count queries.
   - Enforces Free tier caps (3 resumes, 5 job descriptions, 5 monthly question sets, 15 questions per set, and 20 monthly model answers).
   - Throws HTTP 429 (`QUOTA_EXCEEDED`) when limits are breached.
5. **Instant 1-Click ₹0 Simulated Tier Switching (`PATCH /api/v1/usage/tier`)**: Allows placement evaluators and candidates to switch seamlessly between `FREE` and `PRO` tiers with zero credit cards, zero payment gateways, and zero third-party dependencies.

---

## 2. Architecture & Design Implementation

### 2.1 Database Schema & Migrations
- **Enum `ActivityType`**:
  `RESUME_UPLOADED`, `JD_ANALYZED`, `MATCH_EVALUATED`, `QUESTIONS_GENERATED`, `ANSWER_GENERATED`, `COLLECTION_CREATED`, `PDF_EXPORTED`, `TIER_CHANGED`
- **Table `user_activities`**:
  - `id`: Text (UUID Primary Key)
  - `user_id`: Text (Foreign Key ➔ `users(id)` ON DELETE CASCADE)
  - `activity_type`: `ActivityType` NOT NULL
  - `activity_date`: `DATE` NOT NULL (UTC calendar day)
  - `metadata`: `JSONB` DEFAULT `'{}'`
  - `created_at`: `TIMESTAMP(3)` DEFAULT `CURRENT_TIMESTAMP`
  - Indexes: `idx_user_activities_user_id_activity_date_idx`, `idx_user_activities_user_id_created_at_idx`
- **Migration**: `apps/api/prisma/migrations/20261124223500_phase_j_dashboard_activity/migration.sql` deployed cleanly to both `techquery_dev` and `techquery_test` via `techquery_migrator` with DML grants to `techquery_runtime`.

### 2.2 Quota Configuration & Enforcement (`apps/api/src/modules/usage/`)
- **Configuration (`quota.config.ts`)**:
  - `FREE`: 3 resumes, 5 job descriptions, 5 monthly question sets, 15 max questions/set, 20 monthly model answers.
  - `PRO`: 10 resumes, 50 job descriptions, 50 monthly question sets, 25 max questions/set, unlimited monthly model answers (`null`).
- **Service Layer Guard (`usageService.assertWithinQuota`)**:
  - Dynamically computes current consumption for the active calendar month in UTC.
  - Fails fast with HTTP 429 `QUOTA_EXCEEDED` and a descriptive upgrade message if current usage reaches or exceeds the tier limit.
- **Wired Service Integration**:
  - `ResumeService.uploadResume`: enforces resume quota.
  - `JobDescriptionService.createJobDescription`: enforces job description quota.
  - `QuestionService.generateQuestionSet`: enforces monthly question set quota and question size cap.
  - `AnswerService.generateAnswer`: enforces monthly answer quota when generating new answers.

### 2.3 Streak Calculator & Dashboard Summary (`apps/api/src/modules/dashboard/`)
- **Streak Algorithm (`streak.calculator.ts`)**:
  - Normalizes timestamps to UTC calendar days (`YYYY-MM-DD`).
  - Grace period: an activity performed yesterday (`diff === 1`) maintains an active streak while waiting for today's practice.
  - Streak reset: gaps of 2 or more days reset `currentStreak` to 0 while preserving `longestStreak`.
- **Dashboard Service (`dashboard.service.ts`)**:
  - Assembles portfolio KPIs with rounded average match scores (`Math.round(val * 10) / 10`).
  - Assembles recent 10 activity logs and live quota breakdown in a single parallel query pipeline.

---

## 3. API Endpoints Delivered

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/summary` | Portfolio KPIs, active streak, recent activity feed, and quota snapshot | Bearer JWT |
| `GET` | `/api/v1/usage/quotas` | Live breakdown of used, limit, remaining, and unlimited status per resource | Bearer JWT |
| `PATCH` | `/api/v1/usage/tier` | Instant simulated 1-click upgrade/toggle (`FREE` <-> `PRO`) | Bearer JWT |

---

## 4. Verification & Testing

### 4.1 Unit & Integration Test Results
- `apps/api/tests/unit/streak-calculator.test.ts`:
  - 8 unit tests covering empty history, daily deduplication, today vs yesterday grace windows, broken streaks, longest streak preservation, helper utilities, and quota configuration values.
- `apps/api/tests/integration/dashboard-usage.test.ts`:
  - 8 integration tests covering:
    - Fresh account zero-state dashboard summary.
    - End-to-end multi-step workflow aggregation (resumes, JDs, matches, questions, answers, collections, PDF exports) verifying portfolio metrics and event types.
    - Quota reporting accuracy for Free tier.
    - Free tier resume quota enforcement (3 uploads pass, 4th fails with HTTP 429 `QUOTA_EXCEEDED`).
    - Instant 1-click Pro tier upgrade unblocking the 4th upload under Pro allowance.
    - Invalid tier rejection with HTTP 400 `VALIDATION_ERROR`.
    - Tenant isolation (User 2 sees zero metrics/activities/quotas).
    - Unauthenticated request rejection (HTTP 401).

### 4.2 Full Verification Suite Results
- **Workspace Test Coverage (`npm run test:coverage`)**:
  - **34 test files, 301/301 tests passed (100% pass rate)**.
  - Coverage across modules: Dashboard (98.34%), Usage (93.11%), Answers (98.48%), Collections (87.58%), Matching (92.71%), Questions (92.9%), Resume (92.29%), Job Description (97.86%), Auth (94.4%).
- **TypeScript Typecheck (`npm run typecheck`)**: Exit code 0 (zero compiler errors across `api`, `web`, `shared`).
- **Workspace Build (`npm run build`)**: Exit code 0 (clean compilation).
- **Phase A2 Environment Verification**: 27/27 tests passed.
- **Phase A3 Database Verification**: 17/17 tests passed.
- **Phase A3.1 Database Security Audit**: 18/18 tests passed.
- **Phase A4 Express Server & HTTP Verification**: 37/37 tests passed.

---

## 5. Constraint Compliance Check

| Constraint | Status | Notes |
| :--- | :--- | :--- |
| **₹0 Cost Rule** | Pass | Zero payment gateways (Razorpay/Stripe); simulated tier toggle stored in PostgreSQL. |
| **No Redis / BullMQ** | Pass | Quotas tracked via PostgreSQL count queries; zero external caching or queue services required. |
| **Architecture Hierarchy** | Pass | Strict Controller -> Service -> Repository pattern with Zod & AppError. |
| **BOLA / IDOR Defense** | Pass | All dashboard queries and quota calculations strictly scoped to `req.user.userId`. |
| **Legacy Protection** | Pass | Zero modifications to `backend/` or `frontend/`. |
| **Git Hygiene** | Pass | Zero Git commits created. |
