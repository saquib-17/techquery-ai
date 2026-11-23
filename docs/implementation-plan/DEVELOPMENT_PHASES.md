# TechQuery AI — Development Phases (Phases A through K)

## Document Overview
This document defines the sequential, dependency-ordered delivery roadmap for TechQuery AI V1. Each phase represents a self-contained, testable vertical slice designed to ensure zero-cost viability, security isolation, and strict verification at each stage before downstream dependencies commence.

---

## Phase Summary Matrix

| Phase | Title | Core Objective | Key Deliverable | Est. Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase A** | Project Foundation & Database Setup | Monorepo layout, Docker compose, Prisma schema, DB migrations, Seed data | Runnable local PostgreSQL/Redis/Node harness with healthchecks | Sprint 1 |
| **Phase B** | Authentication, Identity & Tenant Isolation | JWT in HttpOnly cookies, refresh token rotation, argon2 hashing, ownership middleware | Secure registration, login, logout, refresh flow with IDOR guards | Sprint 1-2 |
| **Phase C** | User Onboarding & Candidate Profile | Target role, primary domain, experience level, skill declarations, target companies | CRUD profile endpoints, onboarding completion gate | Sprint 2 |
| **Phase D** | Document Ingestion & Text Extraction | PDF (`pdf-parse`) and DOCX (`mammoth`) file upload, security validation, raw text storage | Local file storage / Bytea DB storage with extraction pipeline | Sprint 2-3 |
| **Phase E** | Resume Intelligence Engine | Resume parsing, structured extraction (skills, experience, education, projects) via AI Gateway | Validated JSON extraction with Zod schema and fallback parsing | Sprint 3 |
| **Phase F** | Job Description Intelligence Engine | Raw text/paste JD parsing, role classification, required vs preferred skill extraction | Structured JD record, extracted skill taxonomy mapping | Sprint 3-4 |
| **Phase G** | Resume-JD Matching & Skill-Gap Analysis | Deterministic matching score, missing skills, matched skills, readiness assessment | Transparent matching engine with math-grounded scoring | Sprint 4 |
| **Phase H** | Question Generation Engine | Behavioral, technical, system design, situational question generation from profile & gaps | Tailored question catalog with difficulty and category classification | Sprint 4-5 |
| **Phase I** | AI Answer Generation Engine | STAR framework answers, technical talking points, custom answering tips | Structured answer guides with verification and copy-ready notes | Sprint 5 |
| **Phase J** | Question Collections & PDF Export | Bookmark questions, user practice collections, client-side/serverless PDF generation | Curated prep sheets exported to PDF without paid microservices | Sprint 5-6 |
| **Phase K** | Dashboard, Quotas & V1 Stabilization | Aggregated progress metrics, quota enforcement, cross-phase regression, E2E tests | Production-ready V1 release package meeting all quality gates | Sprint 6 |

---

## Detailed Phase Breakdown

### Phase A: Project Foundation & Database Setup
- **Objective:** Establish the development environment, package structure, database connection pooling, base Prisma schema, and local developer ergonomics.
- **Scope & Features:**
  - TypeScript monorepo/modular layout (`/backend`, `/frontend`, `/shared`).
  - Docker Compose configuration for local PostgreSQL 16 and Redis 7 (Mode A).
  - Prisma initialization with all base models (`User`, `Profile`, `Resume`, `JobDescription`, `Analysis`, `Question`, `Collection`, `AuditLog`, `JobQueue`).
  - Base seeding script for 150+ technology taxonomy tags (languages, frameworks, databases, cloud, tools).
  - Healthcheck endpoints (`/health`, `/health/ready`).
- **Dependencies:** None.
- **Database Migrations:** `0001_init` establishing complete core schema.
- **Testing Gate:**
  - Unit test: Database connection pool initializes and terminates cleanly.
  - Integration test: Healthcheck returns 200 with DB ping status.
  - Seed test: Taxonomy tables populated with verified unique constraints.
- **Exit Criteria:** `docker compose up -d` boots DB and backend; `npm run test` passes 100%.

---

### Phase B: Authentication, Identity & Tenant Isolation
- **Objective:** Implement stateless, zero-cost authentication utilizing cryptographic Argon2id password hashing, short-lived JWT access tokens in memory/headers, and HttpOnly refresh tokens in cookies with automatic rotation.
- **Scope & Features:**
  - Password hashing via `argon2id` (memory-hard, resistant to GPU attacks).
  - Access token (15-minute lifespan) and Refresh token (7-day lifespan) generation.
  - Refresh token rotation (RTR) with reuse detection and instant session revocation.
  - Tenant ownership validation middleware (`enforceOwnership(model, idField)`).
  - Rate limiting middleware (sliding window via memory-cache or Redis).
- **Dependencies:** Phase A.
- **API Endpoints:**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- **Testing Gate:**
  - Security test: Expired tokens rejected with 401.
  - Security test: Tampered refresh token revokes all associated user sessions.
  - Isolation test: User A cannot query User B's profile via direct ID manipulation (IDOR 403 test).
- **Exit Criteria:** Zero security vulnerabilities reported by automated test suite; all token lifecycles fully covered.

---

### Phase C: User Onboarding & Candidate Profile Management
- **Objective:** Allow authenticated users to complete their career baseline, target roles, domains, and declared experience.
- **Scope & Features:**
  - Candidate profile model CRUD operations.
  - Target role selection (`Frontend`, `Backend`, `Fullstack`, `DevOps`, `Data Engineer`, `Mobile`).
  - Experience tier selection (`0-1 Years Junior`, `1-3 Years Mid`, `3-5 Years Senior`, `5+ Years Lead`).
  - Pre-defined and custom skill tag associations.
  - Target company tier mapping (`Service-based`, `Product Startup`, `Enterprise/FAANG-tier`).
- **Dependencies:** Phase B.
- **API Endpoints:**
  - `GET /api/v1/profile`
  - `POST /api/v1/profile`
  - `PUT /api/v1/profile`
  - `GET /api/v1/profile/completion-status`
- **Testing Gate:**
  - Profile state transitions validated: `Incomplete` -> `Complete`.
  - Skill taxonomy integrity: invalid skill IDs rejected with Zod schema validation errors.
- **Exit Criteria:** Profile can be created, updated, and retrieved with strict user isolation.

---

### Phase D: Document Ingestion & Text Extraction (PDF / DOCX)
- **Objective:** Securely ingest resumes in PDF and DOCX formats, enforce file validation, prevent malware/bomb exploits, and extract raw text into normalized records.
- **Scope & Features:**
  - Multer upload configuration with file size limit (max 5 MB).
  - Magic byte verification (verifying file signature, rejecting renamed executables).
  - Local disk storage adapter (`./storage/resumes/{userId}/`) for Mode A.
  - PostgreSQL Bytea / Supabase storage adapter for Mode B.
  - PDF text extraction using `pdf-parse` (handling page breaks, multi-column stream buffers).
  - DOCX text extraction using `mammoth` (extracting raw paragraphs while stripping metadata).
  - Extraction normalization: whitespace trimming, unicode sanitization, bullet normalization.
- **Dependencies:** Phase B, Phase C.
- **API Endpoints:**
  - `POST /api/v1/resumes/upload`
  - `GET /api/v1/resumes`
  - `GET /api/v1/resumes/:id`
  - `DELETE /api/v1/resumes/:id`
- **Testing Gate:**
  - Upload test: File > 5 MB rejected with 413 Payload Too Large.
  - Format test: Corrupted or spoofed PDF (e.g., .exe renamed to .pdf) rejected with 400.
  - Extraction test: Standard 2-page resume yields extracted text string > 500 characters within 300ms.
- **Exit Criteria:** Resumes uploaded, stored with cryptographic hash, and extracted text saved to database.

---

### Phase E: Resume Intelligence & Skill Extraction Engine
- **Objective:** Parse raw resume text into structured candidate intelligence (skills, work history, education, certifications, projects) using the zero-cost AI Gateway with schema enforcement.
- **Scope & Features:**
  - AI Gateway driver integration (`OllamaDriver` locally, `GroqDriver` for cloud showcase).
  - Prompt construction with one-shot structural examples and strict JSON constraints.
  - Zod validation schema for parsed resume entity.
  - Single-attempt repair turn if LLM output fails schema validation.
  - Deterministic fallback parser: Regex-based skill taxonomy scanner when AI is offline.
- **Dependencies:** Phase D.
- **API Endpoints:**
  - `POST /api/v1/resumes/:id/parse`
  - `GET /api/v1/resumes/:id/parsed-data`
- **Testing Gate:**
  - Gateway test: Seamless switch between Ollama and Groq without caller code changes.
  - Schema test: Extracted skills match normalized taxonomy entries.
  - Offline test: Fallback parser extracts known skills when AI Gateway is intentionally disconnected.
- **Exit Criteria:** Raw resume text converted to structured, typed JSON stored in `resumes.parsed_data`.

---

### Phase F: Job Description Intelligence & Parsing Engine
- **Objective:** Ingest, parse, and structure job descriptions from pasted text or uploaded files to extract core requirements, seniority, and tech stack expectations.
- **Scope & Features:**
  - Plain-text JD ingestion with minimum character length validation (min 100 chars).
  - AI-driven structured extraction: role title, company name, experience requirement, required skills, preferred skills, core responsibilities.
  - Skill taxonomy normalization (mapping aliases like "Node", "NodeJS", "Node.js" to unified canonical tag).
  - Role classification according to standard engineering tracks.
- **Dependencies:** Phase B, Phase C.
- **API Endpoints:**
  - `POST /api/v1/job-descriptions`
  - `GET /api/v1/job-descriptions`
  - `GET /api/v1/job-descriptions/:id`
  - `DELETE /api/v1/job-descriptions/:id`
- **Testing Gate:**
  - Extraction accuracy: Required vs preferred skills correctly segmented in 90%+ test fixtures.
  - Alias test: Aliases correctly mapped to canonical IDs from seeded taxonomy.
- **Exit Criteria:** JDs ingested and structured into relational records with extracted skills.

---

### Phase G: Resume-JD Matching & Skill-Gap Analysis Engine
- **Objective:** Compute transparent, deterministic match scores and actionable skill gaps by comparing parsed resume data with target job requirements.
- **Scope & Features:**
  - Weighted matching algorithm:
    - Required Skills Match: 50%
    - Preferred Skills Match: 20%
    - Experience Tier Alignment: 20%
    - Domain/Role Keyword Alignment: 10%
  - Skill gap categorization:
    - Critical Missing Skills (required by JD, absent from resume).
    - Secondary Missing Skills (preferred by JD, absent from resume).
    - Matched Skills (present in both).
    - Overqualified / Additional Skills (present in resume, not requested in JD).
  - Mathematical determinism: identical inputs yield identical scores (no LLM hallucination in numeric score).
  - AI-generated executive narrative: 3-paragraph summary explaining score breakdown and priority focus areas.
- **Dependencies:** Phase E, Phase F.
- **API Endpoints:**
  - `POST /api/v1/analysis/match`
  - `GET /api/v1/analysis/:id`
  - `GET /api/v1/analysis`
- **Testing Gate:**
  - Math consistency test: Perfect skill match yields score >= 90%.
  - Zero skill match yields score <= 20%.
  - Execution speed: Analysis computed in < 150ms (excluding optional AI narrative generation).
- **Exit Criteria:** Deterministic match report generated, stored in `analyses` table, viewable via API.

---

### Phase H: Personalized Interview Question Generation Engine
- **Objective:** Generate highly contextual, role-specific, and skill-gap-focused interview questions spanning technical, system design, and behavioral categories.
- **Scope & Features:**
  - Question generator pipeline taking Candidate Profile + Resume + JD + Gap Analysis.
  - Category distribution:
    - Technical Depth (focused on matched skills and missing critical skills).
    - Architecture & System Design (scaled to candidate's declared seniority).
    - Behavioral / Situational (STAR-focused on resume project bullets).
  - Question metadata: category, difficulty (`Junior`, `Mid`, `Senior`), expected duration, rationale.
  - Anti-duplication hash generation to prevent duplicate questions across regeneration turns.
- **Dependencies:** Phase G.
- **API Endpoints:**
  - `POST /api/v1/questions/generate`
  - `GET /api/v1/questions`
  - `GET /api/v1/questions/:id`
- **Testing Gate:**
  - Relevance test: Generated technical questions contain keywords from candidate's identified skill gaps.
  - Diversity test: Output contains balanced distribution of technical and behavioral questions.
- **Exit Criteria:** 10-15 tailored questions generated per session and persisted to `questions` table.

---

### Phase I: AI-Assisted Answer Generation & Framework Structuring
- **Objective:** Provide structured model answers, key talking points, technical trade-offs, and STAR framework guides for generated questions.
- **Scope & Features:**
  - Contextual answer generation based on the candidate's actual projects and experience level.
  - Behavioral questions: STAR structure (`Situation`, `Task`, `Action`, `Result`).
  - Technical questions: Core concept explanation, code snippet or pseudo-code, trade-off analysis, edge-case discussion.
  - Streaming response delivery (`Server-Sent Events`) for responsive UX during local LLM inference.
  - User custom notes and personal answer draft storage.
- **Dependencies:** Phase H.
- **API Endpoints:**
  - `POST /api/v1/questions/:id/generate-answer` (supports SSE streaming)
  - `PUT /api/v1/questions/:id/user-answer` (saves user's customized notes)
- **Testing Gate:**
  - Streaming test: SSE stream emits valid chunks and closes with `[DONE]`.
  - Schema test: Behavioral answers conform to 4-part STAR structure.
- **Exit Criteria:** Users can request model answers and store personal practice revisions.

---

### Phase J: Question Collections & PDF Export Engine
- **Objective:** Enable candidates to curate custom interview question sets and export clean, branded preparation cheat-sheets in PDF format without paid services.
- **Scope & Features:**
  - Collection management: create, rename, tag, and organize question lists.
  - Client-side PDF generation via `@react-pdf/renderer` or `jspdf` (100% free, zero server CPU overhead).
  - Server-side fallback print stylesheet for direct browser printing (`window.print()`).
  - Formatted export including: Job Target, Resume Summary, Match Score, Questions grouped by category, and Model Answers.
- **Dependencies:** Phase I.
- **API Endpoints:**
  - `POST /api/v1/collections`
  - `GET /api/v1/collections`
  - `POST /api/v1/collections/:id/items`
  - `DELETE /api/v1/collections/:id/items/:itemId`
- **Testing Gate:**
  - Export test: Generated PDF renders within 2 seconds without truncated text or broken layouts.
  - Isolation test: Users cannot add questions owned by other users to their collections.
- **Exit Criteria:** Users can create custom collections and export ready-to-print study guides.

---

### Phase K: Dashboard, Quota Tracking & System Stabilization (V1 Release Gate)
- **Objective:** Complete the analytical dashboard, enforce usage tier limits, perform end-to-end regression testing, and package the release.
- **Scope & Features:**
  - Aggregated dashboard endpoint: profile readiness, match history summary, top skill gaps, question practice count.
  - Quota tracker middleware: enforces daily LLM request limits (Mode B) and rate limits.
  - Performance profiling: database queries optimized with indexes; slow queries < 50ms.
  - Playwright E2E test suite covering full user journey from registration to PDF export.
  - Cold-start resilience handler for cloud deployment (Render keep-warm banner).
- **Dependencies:** Phases A through J.
- **API Endpoints:**
  - `GET /api/v1/dashboard/summary`
  - `GET /api/v1/users/usage-limits`
- **Testing Gate:**
  - E2E test suite passes 100% across local and cloud environments.
  - Zero unhandled promise rejections or memory leaks during sustained load tests.
- **Exit Criteria:** System passes all items on the V1 Definition of Done; fully ready for MCA placement demonstrations.
