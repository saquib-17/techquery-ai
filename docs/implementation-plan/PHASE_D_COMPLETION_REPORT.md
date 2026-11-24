# Phase D: AI Gateway Foundation & Resume Intelligence Engine — Completion Report

**Project:** TechQuery AI  
**Phase:** Phase D (Backend Only)  
**Date:** 2026-11-24  
**Status:** Completed & Fully Verified  
**Operating Principle:** ₹0 Development & Operational Cost, Decoupled Architecture, Local-First AI, Strict Zero-Trust Security  

---

## 1. Executive Summary

Phase D establishes the centralized, decoupled **AI Gateway subsystem** and the **Resume Intelligence Engine** (structured career parsing, comprehensive ATS audit scoring, section breakdowns, and Google X-Y-Z improvement suggestions).

Key milestones achieved:
- **₹0 Operational Cost:** Native local inference via `OllamaDriver` (default in development), with optional `GroqDriver` (cloud showcase), and a 100% deterministic, offline `MockDriver` for CI/Vitest runs.
- **Centralized AI Gateway:** Business services never communicate directly with AI SDKs or providers. The Gateway enforces defensive JSON sanitization, strict Zod schema validation, an automatic **1-turn repair loop** (temp: 0.0) on validation errors, and deterministic heuristic fallbacks so that requests never fail with unhandled 500 errors.
- **Relational Persistence:** Migrated PostgreSQL models under `techquery_migrator` (`resume_analyses` table and `resumes.parsed_data` JSON column) with least-privilege DML grants to `techquery_runtime`.
- **Tenant Isolation & Security:** All analyze and retrieval endpoints enforce strict BOLA/IDOR protection. Prompt construction uses structural delimiter tags (`<resume_content>...</resume_content>`) and anti-prompt-injection system instructions.
- **100% Verification:** All 22 test files (166 tests) pass cleanly with 89.59% statement coverage and zero regressions across Phase A, B, and C test suites.

---

## 2. Deliverables & Implemented Modules

### 2.1 Environment Configuration & Secret Protection (`apps/api/src/core/config`)
- **`env.schema.ts`:**
  - `AI_PROVIDER`: `z.enum(['ollama', 'groq', 'mock']).default('ollama')`
  - `OLLAMA_BASE_URL`: `z.string().url().default('http://localhost:11434')`
  - `AI_LOCAL_MODEL`: `z.string().min(1).default('llama3.2:3b')`
  - `GROQ_API_KEY`: `z.string().optional()`
  - `GROQ_MODEL`: `z.string().min(1).default('llama-3.1-8b-instant')`
  - `AI_TIMEOUT_MS`: `z.coerce.number().int().positive().default(15000)`
- **`logger/index.ts`:**
  - Added `GROQ_API_KEY`, `*.GROQ_API_KEY`, `groqApiKey`, `*.groqApiKey`, `apiKey`, and `*.apiKey` to Pino's sensitive data redaction list.

### 2.2 Database Models & Migrations (`apps/api/prisma`)
- **Prisma Schema (`schema.prisma`):**
  - Updated `Resume` model: Added `parsedData Json? @map("parsed_data")` and relation `analysis ResumeAnalysis?`.
  - Added `ResumeAnalysis` model (`resume_analyses` table):
    - `id String @id @default(uuid())`
    - `resumeId String @unique @map("resume_id")`
    - `atsScore Int @map("ats_score")`
    - `sectionScores Json @map("section_scores")`
    - `strengths Json`
    - `issues Json`
    - `improvements Json`
    - `providerUsed String @map("provider_used")`
    - `createdAt DateTime @default(now())`
    - `updatedAt DateTime @updatedAt`
    - Relation to `Resume` with `onDelete: Cascade`.
- **Migration SQL (`20261124175700_phase_d_models`):**
  - Applied safely to both `techquery_dev` and `techquery_test` via `techquery_migrator`.
  - Granted `SELECT, INSERT, UPDATE, DELETE` on `resume_analyses` and `resumes` to `techquery_runtime`.

### 2.3 Centralized AI Gateway (`apps/api/src/core/ai`)
- **`ai.types.ts`:** Common contracts (`AIGatewayProvider`, `CompletionOptions`, `StructuredAIResult<T>`, `AIProviderId`).
- **`json-sanitizer.ts`:** Strips markdown code fences (```` ```json ... ``` ````), extracts balanced JSON structures from conversational chatter, and handles unescaped characters.
- **`drivers/ollama.driver.ts`:** HTTP client calling `${OLLAMA_BASE_URL}/api/generate` with native JSON mode (`format: "json"`) and `AbortController` timeout (`AI_TIMEOUT_MS`). Throws `ServiceUnavailableError` (503) on unreachable service.
- **`drivers/groq.driver.ts`:** Cloud free-tier driver calling `https://api.groq.com/openai/v1/chat/completions` with `response_format: { type: "json_object" }`. Handles HTTP 429 rate limits gracefully.
- **`drivers/mock.driver.ts`:** Deterministic offline driver generating realistic, schema-compliant JSON payloads for `ATS_AUDIT` and `RESUME_PARSE` based on tokens detected in prompt text.
- **`prompt.registry.ts`:** Versioned prompt templates (`buildResumeParsePrompt` and `buildAtsAuditPrompt`) enforcing strict output contracts and anti-prompt-injection delimiters (`<resume_content>`).
- **`ai.gateway.ts`:** Orchestrates provider execution, validates via `zod.safeParse()`, performs a **1-turn auto-repair loop** (temp: 0.0) on validation errors, and invokes deterministic fallbacks when necessary.

### 2.4 Resume Intelligence Module (`apps/api/src/modules/resume`)
- **`resume-intelligence.schemas.ts`:** Strongly typed Zod schemas:
  - `ParsedResumeDataSchema`: `summary`, `skills` (`technical`, `tools`, `soft`), `experience`, `education`, `projects`.
  - `ATSAuditResponseSchema`: `atsScore` (0–100), `sectionScores` (`contact`, `summary`, `experience`, `skills`, `education`), `strengths`, `issues`, `improvements` (`{ original, suggested, reason }`).
- **`resume-intelligence.fallback.ts`:** Deterministic heuristic fallbacks (`deterministicParseResume` and `deterministicAtsAudit`) ensuring guaranteed baseline availability.
- **`resume.repository.ts` & `resume.service.ts`:**
  - `analyzeResume(userId, resumeId)`: Verifies ownership, validates text extraction, runs AI parse & ATS audit, persists structured graph and analysis atomically.
  - `getResumeAnalysis(userId, resumeId)`: Retrieves stored ATS quality audit (404 if not yet analyzed).
  - `getParsedResumeData(userId, resumeId)`: Retrieves extracted career graph (404 if not yet analyzed).
- **`resume.routes.ts` & `resume.controller.ts`:**
  - `POST /api/v1/resumes/:id/analyze`
  - `GET /api/v1/resumes/:id/analysis`
  - `GET /api/v1/resumes/:id/parsed-data`

---

## 3. Verification & Code Coverage Results

### 3.1 Test Execution (`vitest run --coverage`)
- **Total Test Files:** **22 passed / 22 total**
- **Total Tests:** **166 passed / 166 total** (0 failed, 0 skipped)
- **Duration:** 48.54s

### 3.2 Exact Coverage Metrics (V8 Provider)

| Coverage Metric | Result | Target Threshold | Status |
| :--- | :--- | :--- | :--- |
| **Statements (% Stmts)** | **89.59%** | 80.00% | **PASSED** |
| **Branches (% Branch)** | **76.79%** | 75.00% | **PASSED** |
| **Functions (% Funcs)** | **96.15%** | 80.00% | **PASSED** |
| **Lines (% Lines)** | **89.59%** | 80.00% | **PASSED** |

#### File-by-File Highlights
- `src/core/ai/prompt.registry.ts`: **100%** Stmts, **100%** Branch
- `src/core/ai/drivers/mock.driver.ts`: **94.26%** Stmts, **76.92%** Branch
- `src/core/ai/ai.gateway.ts`: **85.12%** Stmts, **68.18%** Branch
- `src/core/ai/json-sanitizer.ts`: **83.33%** Stmts, **90.32%** Branch
- `src/modules/resume/resume-intelligence.fallback.ts`: **94.40%** Stmts, **86.48%** Branch
- `src/modules/resume/resume-intelligence.schemas.ts`: **100%** Stmts, **100%** Branch
- `src/modules/resume/resume.repository.ts`: **90.35%** Stmts, **78.57%** Branch
- `src/modules/resume/resume.service.ts`: **89.89%** Stmts, **72.72%** Branch
- `src/modules/resume/resume.controller.ts`: **90.00%** Stmts, **46.34%** Branch
- `src/modules/resume/resume.routes.ts`: **100%** Stmts, **100%** Branch

---

## 4. Regression Checklist

| Step | Command | Exit Code | Result |
| :--- | :--- | :--- | :--- |
| **1. Full Coverage Suite** | `npm --prefix apps/api run test:coverage` | `0` | **166/166 PASSED** |
| **2. TypeScript Check** | `npm --prefix apps/api run typecheck` | `0` | **0 errors (clean)** |
| **3. Production Build** | `npm --prefix apps/api run build` | `0` | **Clean compilation to `dist/`** |
| **4. Phase A2 Regression** | `npx tsx scripts/verify-a2.ts` | `0` | **27/27 PASSED** |
| **5. Phase A3 Regression** | `npx tsx scripts/verify-a3.ts` | `0` | **17/17 PASSED** |
| **6. Phase A3.1 Security** | `npx tsx scripts/verify-a3-1.ts` | `0` | **18/18 PASSED** (DML allowed, DDL blocked) |
| **7. Phase A4 Regression** | `npx tsx scripts/verify-a4.ts` | `0` | **37/37 PASSED** |
| **8. Git Status Hygiene** | `git status` | `0` | **Clean working tree, 0 commits** |

---

## 5. Strict Stop Condition

Phase D is complete, audited, and verified.
**Phase E has NOT been started.** Awaiting explicit user approval before proceeding.
