# Phase F Completion Report — Resume & Job Matching Engine

**Document ID:** TQ-PHASE-F-REPORT  
**Date:** 2026-11-24  
**Status:** COMPLETED & VERIFIED (₹0 Cost Strictly Preserved)  
**Author:** Backend Architecture & Security Engineering Team  

---

## 1. Executive Summary

Phase F of TechQuery AI implemented the Resume-to-Job-Description Matching Engine. The engine combines deterministic, rule-based mathematical scoring with AI-powered qualitative evaluation to ensure 100% reproducible numeric scores without LLM hallucination, while enriching match reports with actionable interview preparation guidance.

All components adhere strictly to the ₹0 cost principle, Controller → Service → Repository architecture, strict BOLA/IDOR security isolation, and least-privilege PostgreSQL database access.

---

## 2. Key Architecture & Deliverables

### 2.1 Database Layer (`job_matches`)
- **Table:** `job_matches` mapped via Prisma model `JobMatch`.
- **Primary & Foreign Keys:**
  - `id`: UUID primary key.
  - `user_id`: UUID FK referencing `users(id)` `ON DELETE CASCADE`.
  - `resume_id`: UUID FK referencing `resumes(id)` `ON DELETE CASCADE`.
  - `jd_id`: UUID FK referencing `job_descriptions(id)` `ON DELETE CASCADE`.
- **Columns:**
  - `match_score`: Integer (0–100) computed deterministically.
  - `score_breakdown`: JSONB storing component scores (`mustHaveSkillsScore`, `niceToHaveSkillsScore`, `experienceScore`, `domainScore`).
  - `matched_skills`: JSONB array of overlapping skills (original casing preserved).
  - `missing_skills`: JSONB array of `{ skill, importance: "HIGH" | "MEDIUM" | "LOW", category }`.
  - `analysis_json`: JSONB qualitative evaluation (`experienceMatch`, `projectRelevance`, `strengths`, `weaknesses`, `recommendations`).
  - `provider_used`: String indicating AI provider (`OLLAMA`, `GROQ`, `MOCK`, `FALLBACK`).
- **Constraints & Indexes:**
  - Unique composite index: `@@unique([resumeId, jdId])` enabling atomic upserts.
  - Multi-column index: `@@index([userId, createdAt])` for wire-optimized user match listings.
  - Foreign key indexes: `@@index([resumeId])`, `@@index([jdId])`.
- **Least-Privilege Security:**
  - Migration deployed via `techquery_migrator` (DDL owner) to both `techquery_dev` and `techquery_test`.
  - Permissions granted to `techquery_runtime` restricted strictly to `SELECT, INSERT, UPDATE, DELETE`. Zero DDL permissions.

### 2.2 Deterministic Scoring Calculator (`matching.calculator.ts`)
- **Hallucination Prevention:** The overall match score is 100% deterministic and calculated in TypeScript:
  - **50% Weight:** Must-Have Skills match ratio against job requirements.
  - **20% Weight:** Nice-To-Have Skills match ratio.
  - **20% Weight:** Experience alignment (compares resume/profile experience against JD minimum requirements).
  - **10% Weight:** Domain & Tech Stack category overlap (languages, frameworks, databases, cloud/DevOps).
- **Skill Normalization & Aliasing:** Canonical aliases mapped (e.g. `reactjs` ➔ `react`, `postgres` ➔ `postgresql`, `k8s` ➔ `kubernetes`).
- **Missing Skill Classification:** Categorizes missing skills by importance (`HIGH` for must-have, `MEDIUM` for nice-to-have, `LOW` for general tech stack).

### 2.3 AI Qualitative Evaluation & Deterministic Fallback (`matching.fallback.ts`)
- **Centralized AI Gateway Integration:**
  - Prompt construction via `PromptRegistry.buildMatchAnalysisPrompt` with security delimiters (`<resume_context>`, `<job_description_context>`) and anti-injection instructions.
  - Schema validation via `MatchQualitativeAnalysisSchema` with 1-turn auto-repair.
  - Mock driver support via `generateMockMatchAnalysis` returning schema-valid qualitative reports in test environments.
- **Offline Deterministic Fallback:**
  - If Ollama daemon is offline or AI provider fails, `deterministicQualitativeAnalysis` generates structured narrative, strengths, weaknesses, and preparation recommendations without failing the HTTP request (`providerUsed: "FALLBACK"`).

### 2.4 API Endpoints & BOLA/IDOR Security (`matching.controller.ts`, `matching.routes.ts`)
Mounted at `/api/v1/matches` (and aliased at `/api/v1/match`):
- `POST /api/v1/matches`: Evaluates resume against job description. Enforces resume & JD ownership; returns HTTP 201 with full breakdown. Upserts cleanly on repeated calls.
- `GET /api/v1/matches`: Lists authenticated user's match history with resume and JD summary metadata.
- `GET /api/v1/matches/:id`: Retrieves specific match report. Enforces IDOR check (`userId === req.user.userId`).
- `DELETE /api/v1/matches/:id`: Deletes match report. Enforces IDOR check (`userId === req.user.userId`).

---

## 3. Test Coverage Summary

- **Unit Tests (`tests/unit/matching-calculator.test.ts`):**
  - 9/9 tests passed (skill normalization, alias handling, weighted math calculation, missing skill importance classification, fallback narrative generation, prompt security injection delimiters).
- **Integration Tests (`tests/integration/matching.test.ts`):**
  - 14/14 tests passed (full evaluation flow, upsert idempotency, BOLA/IDOR isolation between User 1 and User 2, raw text skill fallback, unauthenticated 401 handling, deterministic fallback on AI gateway error).
- **Total Suite Passing:** All 23 Phase F tests pass cleanly with 0 failures.
