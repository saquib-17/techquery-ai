# Phase H Completion Report — AI Answer Generation & Customization Engine

**Document ID:** TQ-PHASE-H-REPORT  
**Date:** 2026-11-24  
**Status:** COMPLETED & VERIFIED (₹0 Cost Strictly Preserved)  
**Author:** Backend Architecture & Security Engineering Team  

---

## 1. Executive Summary

Phase H of TechQuery AI implemented the AI Answer Generation & Customization Engine (`AGEN`). The system enables candidates to generate tailored, interview-ready model answers for practice questions—contextualized using the candidate's parsed resume and target job description when linked to the parent `QuestionSet`.

Key architectural highlights:
- **Category-Calibrated Structure:** `BEHAVIORAL` and `PROJECT_DEFENSE` answers are rigorously formatted in the **STAR method** (`Situation`, `Task`, `Action`, `Result`) with code snippets and Big-O complexities strictly normalized to `null`. Technical questions (`CODING`, `THEORETICAL`, `SYSTEM_DESIGN`) feature clean code/query snippets, Big-O complexities, and concrete anti-patterns/pitfalls.
- **Smart Caching & Style Customization:** Re-requesting answers with `regenerate: false` and matching style returns cached records (saving LLM tokens). Changing styles (`CONCISE`, `DETAILED`, `INTERVIEW`) or specifying `regenerate: true` dynamically updates the record via upsert.
- **Zero-Cost Local-First Resilience:** Centralized AI Gateway with deterministic offline fallback (`deterministicAnswerFallback`), ensuring 100% availability without paid APIs or cloud dependencies.
- **BOLA/IDOR Protection:** Strict ownership verification traversing `Answer -> Question -> QuestionSet -> userId`.
- **Zero Git Commits:** Strict adherence to project constraints.

---

## 2. Key Architecture & Deliverables

### 2.1 Database Layer (`answers`)
- **Model `Answer` (`answers` table):**
  - Primary key `id` (`UUID` / `TEXT`).
  - Foreign key: `questionId` (`question_id`), with `@unique` constraint and `ON DELETE CASCADE` via `questions(id)`.
  - Content: `shortSummary` (`TEXT`), `detailedExplanation` (`TEXT`), `codeSnippet` (`TEXT?`), `timeComplexity` (`VARCHAR(50)?`), `spaceComplexity` (`VARCHAR(50)?`), `commonMistakes` (`JSONB`).
  - Metadata: `style` (`VARCHAR(30)` default `"INTERVIEW"`), `providerUsed` (`VARCHAR(50)`), `createdAt` (`TIMESTAMPTZ`), `updatedAt` (`TIMESTAMPTZ`).
- **Parent Question Back-Relation:**
  - Added `answer Answer?` to `model Question` in `schema.prisma`.
  - Updated `question.repository.ts` (`findByIdAndUserId`) to include nested `answer: true` so question set queries automatically reflect generated answers.
- **Least-Privilege Security:**
  - Migration `20261124212500_phase_h_answers` deployed to both `techquery_dev` and `techquery_test` via `techquery_migrator`.
  - DML permissions (`SELECT, INSERT, UPDATE, DELETE`) granted to `techquery_runtime` (zero DDL permissions).

### 2.2 AI Gateway Extension (`AGEN`)
- **Prompt Registry (`PromptRegistry.buildAnswerGenPrompt`):**
  - Encloses question details, resume excerpt, and target JD inside strict XML delimiters (`<question_context>`, `<resume_context>`, `<job_description_context>`).
  - Enforces anti-prompt-injection directives treating all user-supplied data as passive text.
  - Implements category formatting rules (STAR format for behavioral, Big-O and code snippets for technical).
- **Mock Driver (`MockDriver.generateMockAnswer`):**
  - Handles `AGEN` deterministically, parsing category and skill tokens to return schema-valid JSON for 100% offline CI testing.

### 2.3 Answers Domain Module (`apps/api/src/modules/answers/`)
- **Schemas (`answer.schemas.ts`):** `AnswerStyleEnum` (`CONCISE`, `DETAILED`, `INTERVIEW`), `GenerateAnswerSchema`, `QuestionIdParamSchema`, and `AnswerAIResponseSchema`.
- **Deterministic Offline Fallback (`answer.fallback.ts`):** Produces realistic, tailored model answers matching requested style and category constraints when the AI provider is offline.
- **Repository (`answer.repository.ts`):** `findOwnedQuestionWithContext`, `upsertAnswer`, `findAnswerByQuestionIdAndUserId`, `deleteAnswerByQuestionIdAndUserId`.
- **Service (`answer.service.ts`):** BOLA/IDOR ownership validation, token-saving caching, AI generation with fallback, behavioral normalization, and atomic upsert.
- **Controller & Routes (`answer.controller.ts`, `answer.routes.ts`):**
  - Mounted under `/api/v1/answers` in `apps/api/src/app.ts` with `requireAuth` protection:
    - `POST /api/v1/answers/generate` (`201 Created` on new, `200 OK` on cached/updated)
    - `GET /api/v1/answers/:questionId` (`200 OK`)
    - `DELETE /api/v1/answers/:questionId` (`200 OK`)

---

## 3. Automated Test Coverage
- **Unit Tests:** `apps/api/tests/unit/answer-generator.test.ts` (13 / 13 tests passed)
- **Integration Tests:** `apps/api/tests/integration/answers.test.ts` (16 / 16 tests passed)
- **Total Test Suite:** All 30 test files and 268 / 268 tests passed.
