# TechQuery AI — Task Breakdown & Dependencies

## Document Overview
This document provides the granular, numbered task breakdown for the implementation of TechQuery AI V1 across Phases A through K. Every task includes strict prerequisite dependencies, specific deliverables, required test suites, acceptance criteria, and complexity sizing.

---

## Complexity Legend
- **S (Small):** 1-2 hours. Minimal logic, configuration, or straightforward boilerplate.
- **M (Medium):** 3-6 hours. Standard CRUD endpoint, service implementation, or schema migration.
- **L (Large):** 1-2 days. Complex algorithmic logic, multi-step pipeline, or critical security integration.
- **XL (Extra Large):** 2-3 days. Core system orchestration, AI gateway fallbacks, or cross-cutting E2E flows.

---

## Granular Task Catalog

### Phase A: Project Foundation & Database Setup

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-A1** | Project Initialization & Monorepo Setup | None | `package.json`, `tsconfig.json`, `.gitignore`, `.editorconfig` | Build script executes cleanly | TypeScript compiles with `strict: true`; no build warnings | S |
| **TASK-A2** | Docker Compose Stack (PostgreSQL + Redis) | TASK-A1 | `docker-compose.yml`, `.env.example` | Docker healthchecks pass | `docker compose up -d` boots Postgres 16 and Redis 7 with persistent volumes | M |
| **TASK-A3** | Prisma Schema & Initial Migration | TASK-A2 | `prisma/schema.prisma`, `prisma/migrations/0001_init` | `npx prisma migrate dev` succeeds | All 10 models, enums, indexes, and relations generated and verified | M |
| **TASK-A4** | Skill Taxonomy Seeder | TASK-A3 | `prisma/seeds/seed.ts`, `prisma/seeds/taxonomy.json` | Seeder idempotency test | 150+ canonical skills inserted; running seed twice causes no duplicate errors | M |
| **TASK-A5** | Core Express App & Healthchecks | TASK-A1 | `src/app.ts`, `src/server.ts`, `src/core/config/env.ts` | Integration test on `/health` and `/health/ready` | Server starts on configured PORT; health endpoints return 200 with DB status | M |

---

### Phase B: Authentication, Identity & Tenant Isolation

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-B1** | Password Hashing & Token Utilities | TASK-A5 | `src/core/security/hash.ts`, `src/core/security/jwt.ts` | Unit tests for Argon2id and JWT signing/verification | Argon2id verification succeeds; tampered JWT rejected | M |
| **TASK-B2** | Auth Service & Refresh Token Rotation | TASK-B1, TASK-A3 | `src/modules/auth/auth.service.ts`, `src/modules/auth/auth.repository.ts` | Integration test for registration, login, token rotation | Refreshing rotates token; reusing old token revokes entire session family | L |
| **TASK-B3** | Auth Controllers & HTTP Endpoints | TASK-B2 | `src/modules/auth/auth.controller.ts`, `src/modules/auth/auth.routes.ts` | Supertest integration suite | `/register`, `/login`, `/refresh`, `/logout`, `/me` function per OpenAPI spec | M |
| **TASK-B4** | Tenant Ownership Middleware | TASK-B3 | `src/core/middleware/tenant.middleware.ts` | IDOR simulation tests (User A vs User B) | Direct object manipulation on parameterized routes returns 403 Forbidden | L |

---

### Phase C: User Onboarding & Candidate Profile Management

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-C1** | Profile Validation Schemas | TASK-A1 | `src/modules/profile/profile.schemas.ts` | Schema parsing unit tests | Zod validates targetRole, experienceLevel, skills array | S |
| **TASK-C2** | Profile Service & Repository | TASK-C1, TASK-B4 | `src/modules/profile/profile.service.ts`, `src/modules/profile/profile.repository.ts` | CRUD unit tests with mock DB | Profile creates, updates, and calculates completion percentage | M |
| **TASK-C3** | Profile API Routes & Controller | TASK-C2 | `src/modules/profile/profile.controller.ts`, `src/modules/profile/profile.routes.ts` | Supertest profile API tests | `GET /profile`, `POST /profile`, `PUT /profile` enforce auth and return data | M |

---

### Phase D: Document Ingestion & Text Extraction

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-D1** | Multer Upload & Magic Byte Security | TASK-B4 | `src/core/middleware/upload.middleware.ts` | File validation unit tests | Rejects files > 5MB, non-PDF/DOCX mime types, and renamed executables | M |
| **TASK-D2** | Document Extraction Pipeline (PDF/DOCX) | TASK-D1 | `src/modules/resumes/extractor.service.ts` | Text extraction fixtures test | Valid PDF and DOCX files extract clean, normalized text (>500 chars) | L |
| **TASK-D3** | Dual Storage Adapter (Disk & Bytea) | TASK-D2 | `src/core/storage/storage.factory.ts` | Storage driver switch test | Stores to disk in Mode A; stores to database `Bytes` in Mode B | M |
| **TASK-D4** | Resume CRUD & Ingestion Endpoints | TASK-D3 | `src/modules/resumes/resumes.controller.ts`, `src/modules/resumes/resumes.routes.ts` | Supertest resume upload & delete | Resume upload saves record, extracts text, and links to user | M |

---

### Phase E: Resume Intelligence & Skill Extraction Engine

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-E1** | AI Gateway Core & Mock Driver | TASK-A5 | `src/core/ai-gateway/gateway.ts`, `src/core/ai-gateway/drivers/mock.driver.ts` | Unit tests for prompt execution and parsing | Mock driver returns canned typed responses based on prompt ID | M |
| **TASK-E2** | Ollama & Groq Provider Drivers | TASK-E1 | `src/core/ai-gateway/drivers/ollama.driver.ts`, `src/core/ai-gateway/drivers/groq.driver.ts` | Driver integration tests with live/mock endpoints | Ollama targets local port 11434; Groq driver handles rate-limit retries | L |
| **TASK-E3** | Output Validation & Auto-Repair Loop | TASK-E2 | `src/core/ai-gateway/validator.ts` | Auto-repair test with malformed JSON fixture | Successfully repairs malformed JSON on second turn; fails to fallback if unrepairable | L |
| **TASK-E4** | Deterministic Regex Fallback Scanner | TASK-E3, TASK-A4 | `src/core/ai-gateway/fallback-scanner.ts` | Offline fallback extraction test | Extracts known taxonomy skills when AI is disconnected | M |
| **TASK-E5** | Resume Parsing Service & API Endpoint | TASK-E4, TASK-D4 | `src/modules/resumes/parser.service.ts`, `POST /resumes/:id/parse` | Integration test for resume parsing | Populates `resumes.parsed_data` with valid structured career JSON | M |

---

### Phase F: Job Description Intelligence Engine

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-F1** | JD Parsing Service & Prompt | TASK-E3 | `src/modules/job-descriptions/jd-parser.service.ts` | Unit tests with diverse JD text fixtures | Extracts required vs preferred skills and role seniority | M |
| **TASK-F2** | JD CRUD & Ingestion Endpoints | TASK-F1, TASK-B4 | `src/modules/job-descriptions/job-descriptions.controller.ts`, `routes.ts` | Supertest JD endpoints | Ingests raw JD text, triggers parsing, and returns structured entity | M |

---

### Phase G: Resume-JD Matching & Skill-Gap Analysis Engine

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-G1** | Deterministic Scoring Algorithm | TASK-E5, TASK-F2 | `src/modules/analysis/matcher.service.ts` | 50+ deterministic math test fixtures | Identical inputs produce identical scores; 100% overlap >= 90%; 0% overlap <= 20% | L |
| **TASK-G2** | Skill Gap Segmentation Engine | TASK-G1 | `src/modules/analysis/gap-analyzer.service.ts` | Gap categorization unit tests | Correctly segments critical missing, secondary missing, and matched skills | M |
| **TASK-G3** | Executive Summary AI Generator | TASK-G2, TASK-E3 | `src/modules/analysis/summary-generator.service.ts` | Narrative generation test | Produces 3-paragraph executive narrative explaining gaps and focus | M |
| **TASK-G4** | Analysis Execution API Endpoint | TASK-G3 | `src/modules/analysis/analysis.controller.ts`, `routes.ts` | Full matching integration test | `POST /analysis/match` creates record and returns complete gap analysis | M |

---

### Phase H: Personalized Interview Question Generation Engine

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-H1** | Question Generation Pipeline | TASK-G4 | `src/modules/questions/generator.service.ts` | Question distribution & relevance test | Generates 10-15 questions covering Technical, System Design, and Behavioral | L |
| **TASK-H2** | Anti-Duplication & Hashing | TASK-H1 | `src/modules/questions/dedup.service.ts` | Question deduplication test | Prevents generating duplicate questions across sequential regeneration calls | S |
| **TASK-H3** | Question Listing & Filter Endpoints | TASK-H2 | `src/modules/questions/questions.controller.ts`, `routes.ts` | Supertest filtering by category and difficulty | Returns filtered questions matching query parameters | M |

---

### Phase I: AI-Assisted Answer Generation & Framework Structuring

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-I1** | STAR Behavioral Answer Generator | TASK-H3 | `src/modules/questions/star-generator.service.ts` | STAR schema validation test | Produces structured Situation, Task, Action, Result components | M |
| **TASK-I2** | Technical Model Answer Generator | TASK-I1 | `src/modules/questions/tech-answer-generator.service.ts` | Technical answer format test | Generates theory, code snippets, trade-offs, and edge-cases | M |
| **TASK-I3** | SSE Streaming & Notes Endpoint | TASK-I2 | `POST /questions/:id/generate-answer`, `PUT /questions/:id/user-notes` | SSE stream integration test | Streams response chunks; allows user to save personal practice notes | L |

---

### Phase J: Question Collections & PDF Export Engine

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-J1** | Collection Management CRUD | TASK-H3 | `src/modules/collections/collections.service.ts`, `routes.ts` | Supertest collection operations | Create, rename, delete collections; add and remove questions | M |
| **TASK-J2** | Client-Side PDF Renderer Component | TASK-J1 | `frontend/src/features/collections/PDFExportView.tsx` | PDF layout snapshot test | Generates printable A4 PDF cheat-sheet client-side at ₹0 server cost | L |

---

### Phase K: Dashboard, Quotas & V1 Stabilization

| Task ID | Task Title | Dependencies | Deliverables | Required Tests | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-K1** | Aggregated Dashboard API Endpoint | TASK-C3, TASK-G4, TASK-H3 | `src/modules/dashboard/dashboard.service.ts`, `routes.ts` | Dashboard metrics unit tests | Returns career readiness score, recent analyses, top skill gaps | M |
| **TASK-K2** | Cloud Quota & Rate-Limiting Tracker | TASK-B4 | `src/core/middleware/quota.middleware.ts` | Rate-limit enforcement tests | Limits free-tier daily AI queries to prevent Groq quota exhaustion | M |
| **TASK-K3** | End-to-End User Journey Regression | All Previous Tasks | `tests/e2e/playwright/user-journey.spec.ts` | Playwright test suite passes 100% | Full flow: Signup -> Onboard -> Upload -> Match -> Questions -> PDF | XL |
| **TASK-K4** | Cold-Start Detection & Release Package | TASK-K3 | `frontend/src/core/api/client.ts`, `docker-compose.prod.yml` | Simulated 504 timeout recovery test | Displays cold-start wake-up notification; passes all V1 release gates | M |
