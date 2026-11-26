# TechQuery AI (V2.2)

**All-in-One AI Interview & DSA Command Center**

TechQuery AI is a zero-cost (`₹0`), full-stack TypeScript monorepo that combines ATS resume intelligence, JD skill-gap analysis, AI-grounded interview & DSA question generation, a live Monaco + Judge0 CE Coding Arena with refresh-safe timed/untimed assessments, and a curated **520-Problem Weighted Master DSA Pattern Sheet** across all 22 core interview topics.

---

## Core Capabilities

- **ATS Resume Auditing & Career Graph (`/resumes`)**
  - Upload PDF or DOCX resumes (`pdf-parse` / `mammoth` text extraction with `5MB` size & magic-byte validation).
  - Instant `0–100` ATS score, section-by-section breakdown (`contact`, `summary`, `experience`, `skills`, `education`), actionable bullet-point rewrites, and structured resume parsing.
- **Job Description Intelligence & Skill Gap Matrix (`/job-descriptions`, `/matches`)**
  - Decompose job postings into `roleTitle`, `seniority`, `mustHaveSkills`, `niceToHaveSkills`, and categorized tech stacks.
  - Deterministic token-boundary skill matching + weighted scoring enriched with AI qualitative strengths, weaknesses, and tailoring recommendations.
- **AI Question Studio & Model Answer Studio (`/questions`)**
  - **Role & Resume Mix:** Generate `3–20` tailored questions across `THEORETICAL`, `CODING`, `SYSTEM_DESIGN`, `BEHAVIORAL`, and `PROJECT_DEFENSE` grounded in your resume, JD, or match report.
  - **DSA & Algorithms Mode:** Generate pattern-targeted coding problems (`Arrays & Two Pointers`, `Sliding Window`, `Binary Search`, `Trees & Graphs`, `Dynamic Programming`, `Stack & Heap`) with linked `CodingProblem` records and 1-click **`Solve in Coding Arena`** launch.
  - **Model Answer Studio:** Slide-over drawer with `INTERVIEW`, `CONCISE`, and `DETAILED` styles, structured bullet formatting, VS Code-style syntax-highlighted code blocks, Big-O complexity badges, and common-mistakes callouts.
- **Live Coding Arena & Refresh-Safe OA Engine (`/practice`)**
  - Powered by `@monaco-editor/react` (`vs-dark`, `JetBrains Mono`) and remote **Judge0 CE** execution supporting **Java**, **Python**, **C++**, and **JavaScript**.
  - **LeetCode-Style `class Solution` Signatures:** Clean method signatures backed by hidden server-side `driverCode` harnesses (`{{USER_CODE}}` injection), 12 curated Arena problems (4 Easy, 4 Medium, 4 Hard), and custom AI DSA problem generation.
  - **Configurable Sessions & Refresh-Safe Persistence:** Choose **Untimed Practice** or **Timed OA Simulation** (`30/45/60/75m`), difficulty tracks (`Foundation / EASY_ONLY`, `Placement Ready / EASY_TO_MEDIUM`, `Product / MIXED_WITH_HARD`, `Single Focus`), and `1–3` problem slots. Server-enforced `expiresAt` timers, partial 100-point scoring, dual-layer draft persistence (`localStorage` + debounced PostgreSQL `draftsJson`) surviving browser refreshes, and Recent Sessions management (delete individual past sessions or clear history).
  - **Smart Hidden Test Visibility:** Masks hidden test cases (`[Hidden]`) during `TIMED` OA sessions while revealing full edge-case inputs/outputs in standalone & `UNTIMED` practice.
- **520-Problem Weighted Master DSA Pattern Sheet (`/practice` → `Master DSA Sheet (520)`)**
  - **520 distinct, verified LeetCode problems** spanning **all 22 core topics & patterns**, weighted realistically toward core interview pillars (Arrays & Matrix: 45, Strings: 32, Hashing: 25, Two Pointers & Sliding Window: 22 each, Stack: 22, Binary Search: 28, Linked List: 24, Binary Trees & BSTs: 48, Heap: 20, Recursion & Backtracking: 24, Graphs & Topo/Shortest Path/DSU: 47, 1-D & 2-D DP: 58, Greedy: 22, plus supporting topics), strictly ordered **Easy → Medium → Hard** within every category.
  - Synthesized across **Blind 75**, **NeetCode 150**, **Grind 169**, **Striver SDE Sheet**, **Striver A2Z**, **Apna College (Shradha Ma'am's DSA Sheet)**, **Love Babbar 450**, and **LeetCode Top Interview 150**.
  - Includes clickable 22-pattern mastery telemetry, source-sheet/company/difficulty/status filters with exact filtered counts, persistent `SOLVED`/`REVISION` tracking, personal notes, LeetCode links, and 1-click **`Solve in Arena`** handoff.
  - **AI Guide Slide-Over Drawer:** Plain-English problem explanation, pattern intuition, and **collapsible Brute Force & Optimal reference code** (`Java`, `Python`, `C++`, `JavaScript`) with VS Code Dark+ syntax highlighting, line numbers, and complexity breakdowns.
- **Saved Collections, PDF Export & Dashboard Telemetry (`/library`, `/dashboard`, `/usage`, `/profile`)**
  - Organize questions into study collections, export multi-page PDF packets via `PDFKit`, track 30-day preparation streaks, and manage `FREE` ↔ `PRO` (`₹0` Demo) quotas.

---

## System Architecture & Tech Stack

### Monorepo Layout

```text
techquery-ai/
├── apps/
│   ├── web/            # React 19 SPA (Vite + TypeScript + Tailwind CSS v4 + Monaco Editor)
│   └── api/            # Modular Monolith REST API (Node.js + Express + Prisma + PostgreSQL)
├── packages/
│   └── shared/         # Shared Zod schemas, DTO contracts & 520-problem weighted DSA Sheet dataset
└── docs/               # Product discovery, system design, OpenAPI spec & phase reports
```

### Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend (`apps/web`)** | React 19, TypeScript, Vite, Tailwind CSS v4 ("Obsidian Precision" dark theme), `@monaco-editor/react`, TanStack Query v5, React Router v7, React Hook Form + Zod, Axios (single-flight 401 refresh), Lucide Icons |
| **Backend (`apps/api`)** | Node.js, Express 5, TypeScript, Prisma ORM (`PostgreSQL`), Pino structured logging, Multer, `pdf-parse`, `mammoth`, `pdfkit`, Judge0 CE HTTP adapter |
| **Shared (`packages/shared`)** | TypeScript + Zod domain contracts (`coding.ts`, `questions.ts`, `dsaSheet.ts`) |
| **AI Gateway** | Provider-agnostic `AIGateway` supporting **Groq Cloud** (`openai/gpt-oss-20b` default), local **Ollama** (`llama3.2:3b`), and deterministic offline fallbacks with `JsonSanitizer`, Zod validation, and 1-turn auto-repair |
| **Testing** | Vitest + Supertest (**312** API unit/integration tests) and Vitest + React Testing Library (**38** Web tests) |

---

## API Modules (`apps/api/src/modules`)

| Module | Base Route | Responsibilities |
| :--- | :--- | :--- |
| `auth` | `/api/v1/auth` | Argon2id registration, email verification, JWT access + rotating `HttpOnly` refresh cookies |
| `candidate` | `/api/v1/profile`, `/onboarding` | Candidate profile & 3-step onboarding state machine |
| `resume` | `/api/v1/resumes` | Secure PDF/DOCX upload, text extraction, AI ATS audit & career graph |
| `job-description` | `/api/v1/job-descriptions` | JD parsing, skill extraction & raw posting storage |
| `matching` | `/api/v1/matches` | Deterministic + AI-enriched resume-to-JD skill gap scoring |
| `questions` | `/api/v1/questions`, `/question-sets` | `ROLE_AND_JD` & `DSA_ALGORITHMS` generation + PDF export |
| `answers` | `/api/v1/answers` | Structured STAR / code model answer generation (`INTERVIEW`, `CONCISE`, `DETAILED`) |
| `coding` | `/api/v1/coding` | 12 curated LeetCode problems, AI DSA problem generator, Judge0 CE runner (`SAMPLE`/`SUBMIT`) |
| `assessments` | `/api/v1/assessments` | Refresh-safe `TIMED`/`UNTIMED` sessions, `draftsJson` autosave, `finish`/`cancel`/`delete` lifecycle |
| `dsa-sheet` | `/api/v1/dsa-sheet` | 520-problem sheet progress (`UNSOLVED`/`SOLVED`/`REVISION`), notes & multi-language AI walkthroughs |
| `collections` | `/api/v1/collections` | Saved study collections & PDF packet export |
| `dashboard` / `usage` | `/api/v1/dashboard`, `/usage` | Preparation streaks, activity feed & `FREE`/`PRO` quota enforcement |

---

## Security Engineering Highlights

- **In-Memory Access Tokens + Rotating `HttpOnly` Refresh Cookies:** Access JWTs (`15m`) stay strictly in memory; refresh tokens (`7d`) are stored as SHA-256 hashes in PostgreSQL with `HttpOnly` `SameSite=Lax` cookies, rotation, and reuse-detection revocation.
- **Sandboxed Remote Code Execution:** Untrusted user code is never executed locally with `child_process`; all runs route through `Judge0Adapter` (`JUDGE0_API_URL`) with `driverCode` wrapping and timeout guards.
- **CSRF, BOLA/IDOR & Least-Privilege DB:** `Origin`/`Referer` validation on cookie endpoints, strict `userId` ownership scoping on every resource query, Zod validation on all inputs/AI outputs, and separate runtime (`techquery_runtime`) vs migration (`techquery_migrator`) database roles.

---

## Local Setup & Running

### 1. Prerequisites
- **Node.js** `>= 20` and **npm**
- **PostgreSQL** `>= 15`
- **Groq API Key** (free tier) or local **Ollama** instance

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `apps/api/.env` and configure your PostgreSQL URLs, JWT secret, AI provider, and optional Judge0 settings:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL runtime connection URL | `postgresql://techquery_runtime:...@127.0.0.1:5432/techquery_dev` |
| `MIGRATION_DATABASE_URL` | PostgreSQL migration connection URL | `postgresql://techquery_migrator:...@127.0.0.1:5432/techquery_dev` |
| `JWT_ACCESS_SECRET` | Minimum 32-character JWT signing secret | `...` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `AI_PROVIDER` | Active LLM provider (`groq`, `ollama`, `mock`) | `ollama` |
| `GROQ_API_KEY` / `GROQ_MODEL` | Groq API credentials & model | `openai/gpt-oss-20b` |
| `JUDGE0_API_URL` | Judge0 CE execution endpoint | `https://ce.judge0.com` |
| `JUDGE0_API_KEY` | Optional RapidAPI / self-hosted Judge0 key | *(optional)* |

### 4. Generate Prisma Client & Apply Migrations
```bash
npm run db:generate
npm run db:migrate
```

### 5. Start Development Servers
```bash
npm run dev:api
npm run dev --workspace=@techquery/web
```

### 6. Automated Verification
```bash
npm run test --workspace=@techquery/api    # 37 test files, 312 tests
npm run test --workspace=@techquery/web    # 10 test files, 38 tests
npm run typecheck                          # @techquery/shared, @techquery/api, @techquery/web
npm run build                              # Full monorepo production build
```
