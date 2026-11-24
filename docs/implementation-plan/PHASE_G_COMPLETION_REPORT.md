# Phase G Completion Report — AI Interview Question Generation Engine

**Document ID:** TQ-PHASE-G-REPORT  
**Date:** 2026-11-24  
**Status:** COMPLETED & VERIFIED (₹0 Cost Strictly Preserved)  
**Author:** Backend Architecture & Security Engineering Team  

---

## 1. Executive Summary

Phase G of TechQuery AI implemented the AI Interview Question Generation Engine. The system enables candidates to generate contextual, role-specific, difficulty-calibrated interview practice sets across five distinct categories (`THEORETICAL`, `CODING`, `SYSTEM_DESIGN`, `BEHAVIORAL`, `PROJECT_DEFENSE`).

The engine dynamically weaves together candidate resume data, job description requirements, and identified skill gaps from Phase F match analysis. An offline deterministic fallback ensures that question generation is 100% resilient and functional without external network connectivity or paid AI APIs.

All deliverables adhere strictly to the ₹0 cost principle, Controller → Service → Repository architecture, strict BOLA/IDOR isolation, least-privilege PostgreSQL access, and zero Git commits.

---

## 2. Key Architecture & Deliverables

### 2.1 Database Layer (`question_sets` & `questions`)
- **PostgreSQL Enums:**
  - `QuestionCategory`: `THEORETICAL`, `CODING`, `SYSTEM_DESIGN`, `BEHAVIORAL`, `PROJECT_DEFENSE`.
  - `QuestionDifficulty`: `EASY`, `MEDIUM`, `HARD`.
- **Model `QuestionSet` (`question_sets`):**
  - Primary key `id` (UUID).
  - Foreign keys: `userId` (CASCADE), `resumeId` (SET NULL), `jdId` (SET NULL), `matchId` (SET NULL).
  - Attributes: `title`, `topicFocus`, `difficulty`, `totalCount`, `providerUsed`, `createdAt`, `updatedAt`.
  - Indexes: `@@index([userId, createdAt])`, `@@index([resumeId])`, `@@index([jdId])`, `@@index([matchId])`.
- **Model `Question` (`questions`):**
  - Primary key `id` (UUID).
  - Foreign key: `questionSetId` (CASCADE).
  - Attributes: `questionText`, `category`, `difficulty`, `targetedSkill`, `interviewerIntent`, `keyEvaluationPoints` (JSONB), `createdAt`.
  - Indexes: `@@index([questionSetId])`, `@@index([targetedSkill])`, `@@index([category])`.
- **Downstream Readiness:**
  - Designed for Phase H (Model Answers via 1-to-1 `answers.question_id`) and Phase I (Collections via `collection_items`).
- **Least-Privilege Security:**
  - Migration `20261124200000_phase_g_question_sets` deployed to both `techquery_dev` and `techquery_test` via `techquery_migrator`.
  - Runtime permissions granted to `techquery_runtime` restricted strictly to `SELECT, INSERT, UPDATE, DELETE` (zero DDL).

### 2.2 AI Gateway Extension (`QGEN`)
- **Prompt Registry (`PromptRegistry.buildQuestionGenPrompt`):**
  - Untrusted data enclosed in security context tags: `<resume_context>`, `<job_description_context>`, `<match_context>`.
  - Explicit anti-prompt-injection guidelines forbidding execution of commands inside user data.
  - Category directives and strict JSON schema enforcement (`QuestionSetAIResponseSchema`).
- **Mock Driver (`generateMockQuestionSet`):**
  - Parses prompt parameters (count, difficulty, categories, skill tokens) and produces deterministic schema-valid question sets for 100% offline, zero-cost CI testing.

### 2.3 Questions Domain Module (`apps/api/src/modules/questions/`)
- **Schemas (`question.schemas.ts`):** Zod contracts for `GenerateQuestionSetSchema` (count clamped 3–20, categories array, difficulty default `MEDIUM`), `QuestionSetIdParamSchema`, and AI response contracts.
- **Deterministic Offline Fallback (`question.fallback.ts`):** Produces realistic questions across requested categories and difficulty, weaving in actual skills from resume/JD/match context so question generation never fails during offline operation.
- **Repository (`question.repository.ts`):** Atomic creation of `QuestionSet` with nested `Question[]`, summary listing query, IDOR-protected find and cascade delete.
- **Service (`question.service.ts`):** BOLA/IDOR validation across `resumeId`, `jdId`, and `matchId`, rich context aggregation, AI execution with defensive fallback, question count normalization, and persistence.
- **Controller & Routes (`question.controller.ts`, `question.routes.ts`):** Mounted at `/api/v1/questions` and `/api/v1/question-sets` with `requireAuth` protection.

---

## 3. Test Coverage & Verification Metrics

- **Unit Tests (`tests/unit/question-generator.test.ts`):**
  - 9/9 tests passed (schema validation boundaries, defaults, deterministic fallback across categories and difficulties, prompt security framing, mock driver generation).
- **Integration Tests (`tests/integration/questions.test.ts`):**
  - 14/14 tests passed (standalone generation, contextual generation linked to resume/JD/match, aliased route handling, BOLA/IDOR protection on generation, read, and delete, unauthenticated 401, offline deterministic fallback on AI gateway error).
- **Total Test Suite Execution:** **239 tests passed across 28 test files (0 failures)**.
- **Code Coverage:** All thresholds exceeded (`Statements: 91.13% >= 80%`, `Branches: 76.51% >= 75%`, `Functions: 95.83% >= 80%`, `Lines: 91.13% >= 80%`).
