# TechQuery AI (V2.5)

**360-Degree AI Placement & Interview Operating System**

TechQuery AI is an open-source, zero-cost (`₹0`), full-stack TypeScript placement preparation platform. It unifies ATS resume scoring, JD skill gap analysis, AI-grounded interview and DSA question generation, a live Monaco + Judge0 CE Coding Arena featuring **100 runnable weighted problems with 2,000 verified test cases**, a **520-Problem Weighted Master DSA Pattern Sheet**, a **210-Topic CS Core, System Design & Behavioral Mastery Sheet**, an **AI Learning Roadmap Studio**, and a live **Telemetry-Driven Preparation Dashboard**.

---

## What's New in V2.5

- **100-Problem Weighted Coding Practice Arena (2,000 Test Cases):**
  - Expanded from 12 initial problems to **100 distinct runnable problems** across all core placement patterns (Arrays, Two Pointers, Sliding Window, Binary Search, Trees, Graphs, Linked Lists, Heaps, Tries, Union-Find, Matrix, 1-D & 2-D Dynamic Programming, Stack & Monotonic Stack, Backtracking, Greedy, Intervals, Bit Manipulation, Math, and System Design Data Structures).
  - Every problem features **20 comprehensive test cases** (3 sample + 17 hidden edge cases = **2,000 verified test cases**) running through our high-performance single-batch Judge0 execution harness in a single network round-trip.
  - Multi-language support: **Java**, **Python**, **C++**, and **JavaScript** with authentic LeetCode-style `class Solution` method signatures and server-side driver harnesses.
- **Clean LeetCode-Style Submit Console & Memory Formatting:**
  - **Accepted Verdict:** Displays a clean green Accepted card showing `✓ ACCEPTED · 20 / 20 Test Cases Passed`, execution runtime (`ms`), clean memory formatting (`20.4 MB` for `>= 1024 KB`, `512 KB` below `1 MB`), and confirmation of Master DSA Sheet sync—eliminating hidden case noise.
  - **Failing Verdict:** Highlights the exact first failing test case (`Case #1–#20`) in Coding Practice with **`Input`** (safely truncated at 500 chars), **`Expected Output`**, and **`Your Output`** boxes (plus `Runtime Error` / `Timeout Error` blocks when applicable) and an amber `Hidden Edge Case` badge for `#4–#20`, while keeping `TIMED` OA sessions masked.
- **Compact Pattern-Grouped Problem Bank & Live Status Sync:**
  - Replaced the card grid with high-density, collapsible **22-pattern accordion tables** (`Search`, `Difficulty`, `Status`, `Pattern` dropdown, and `Expand All / Collapse All`).
  - Live **`✓ Solved`** (emerald) and **`◐ Attempted`** (amber) status badges appear right beside the active problem title in the Coding IDE, update immediately on submission, and sync across the Problem Bank and Master DSA Sheet.
- **IDE Resilience & Productivity Toolbar:**
  - **Progressive Hints Drawer:** Collapsible multi-tier hints (Intuition → Algorithm Approach → Optimal Complexity Target) for unblocking without spoiling the solution.
  - **IDE Actions:** One-click Code Formatting, Solution Clipboard Copy, and 2-step Safe Reset with confirmation dialog.
  - **Global Error Boundaries & 404 Route:** Obsidian Precision fallback views prevent blank screens on network or render anomalies; dedicated 404 route catches invalid URLs and problem slugs.
- **Behavioral & HR Interview Mastery (V2.4):**
  - Added a dedicated 7th subject tab inside `/cs-fundamentals` with **45 curated campus and SDE-1 HR/Behavioral questions** across Introduction, Leadership, Conflict, Overcoming Challenges, Work Ethic, and Compensation discussions.
  - Interactive AI Guide generates structured STAR-format responses (Situation, Task, Action, Result) with conversational, authentic candidate delivery.
- **Real Telemetry Dashboard & 30-Day Heatmap (V2.4):**
  - Fully connected to PostgreSQL database state: live metrics for DSA problems solved, CS/SD/HR topics mastered, timed OA assessment scores, and resume ATS audits.
  - 30-day consistency heatmap with streak counters and a 1-click "Continue Your Prep" card that picks up right where you left off.
- **Plain-English UX Overhaul (V2.4):**
  - Cleaned navigation labels and technical jargon across all pages, buttons, and badges into simple, intuitive English (e.g. *Resume Check*, *Target Jobs*, *Skill Match*, *Interview Q&A*, *Coding Practice*, *CS & HR Prep*, *Study Plan*).

---

## Core Capabilities

- **ATS Resume Auditing & Skill Breakdown (`/resumes`)**
  - Upload PDF or DOCX resumes (`pdf-parse` / `mammoth` text extraction with `5MB` size and magic-byte validation).
  - Deterministic + AI-powered `0–100` ATS compatibility score, section-by-section breakdown (`contact`, `summary`, `experience`, `skills`, `education`), and actionable bullet-point rewrites.
- **Job Description Intelligence & Skill Gap Matrix (`/job-descriptions`, `/matches`)**
  - Decompose job postings into `roleTitle`, `seniority`, `mustHaveSkills`, `niceToHaveSkills`, and categorized tech stacks.
  - Deterministic token-boundary skill matching + weighted scoring enriched with AI qualitative strengths, weaknesses, and tailoring recommendations.
- **AI Question Studio & Model Answer Studio (`/questions`)**
  - **Role & Resume Mix:** Generate `3–20` tailored questions across `THEORETICAL`, `CODING`, `SYSTEM_DESIGN`, `BEHAVIORAL`, and `PROJECT_DEFENSE` grounded in your resume, JD, or match report.
  - **DSA & Algorithms Mode:** Generate pattern-targeted coding problems with linked `CodingProblem` records and 1-click **Solve in Coding Arena** launch.
  - **Model Answer Studio:** Slide-over drawer with `INTERVIEW`, `CONCISE`, and `DETAILED` styles, structured bullet formatting, VS Code-style syntax-highlighted code blocks, Big-O complexity badges, and common-mistakes callouts.
- **Live Coding Practice Arena & Refresh-Safe OA Engine (`/practice` or `/coding-arena`)**
  - Powered by `@monaco-editor/react` (`vs-dark`, `JetBrains Mono`) and remote **Judge0 CE** execution.
  - **100 Weighted Problems:** 27 Easy, 52 Medium, 21 Hard spanning all 22 interview patterns.
  - **Configurable Sessions & Refresh-Safe Persistence:** Choose **Untimed Practice** or **Timed OA Simulation** (`30/45/60/75m`), difficulty tracks (`Foundation`, `Placement Ready`, `Product Company`, `Single Focus`), and `1–3` problem slots.
  - Server-enforced `expiresAt` timers, partial 100-point scoring, dual-layer draft persistence (`localStorage` + debounced PostgreSQL `draftsJson`) surviving browser refreshes, and Recent Sessions management.
- **520-Problem Weighted Master DSA Pattern Sheet (`/practice` → `Master DSA Sheet`)**
  - **520 distinct, verified LeetCode problems** spanning all 22 core topics & patterns, weighted toward core interview pillars, strictly ordered **Easy → Medium → Hard**.
  - Synthesized across **Blind 75**, **NeetCode 150**, **Grind 169**, **Striver SDE Sheet**, **Striver A2Z**, **Love Babbar 450**, and **LeetCode Top Interview 150**.
  - Compact telemetry header with stat pills, mastery progress bar, `Filter by Pattern` dropdown, company/source-sheet/difficulty/status filters, persistent `SOLVED`/`REVISION` tracking, personal notes, LeetCode links, and 1-click **Solve in Arena** handoff.
  - **AI Guide Slide-Over Drawer:** Plain-English intuition and collapsible Brute Force & Optimal reference code in Java, Python, C++, and JavaScript with line numbers and Big-O breakdowns.
- **CS Core, System Design & Behavioral Mastery Sheet (`/cs-fundamentals`)**
  - **210 structured topics & questions** across **7 core placement subjects**:
    1. `Operating Systems` (30 topics)
    2. `DBMS` (28 topics)
    3. `SQL & Query Patterns` (28 topics)
    4. `Computer Networks` (28 topics)
    5. `OOP & Software Engineering` (25 topics)
    6. `System Design` (26 topics)
    7. `Behavioral & HR` (45 questions)
  - Persistent `UNSTUDIED` / `LEARNED` / `REVISION` status tracking, personal revision notes, Priority/Status/Company filters.
  - **Adaptive AI Deep-Dive Guides:** Renders multi-line ASCII/Unicode architecture diagrams for System Design/OS/Networks, syntax-highlighted SQL/Java code blocks for implementation topics, and conversational STAR frameworks for HR questions.
- **AI Learning Roadmap Studio (`/roadmap`)**
  - Dynamic week-by-week preparation generator tailored to target roles, timeline (`4–24` weeks), daily study hours, current level, and focus skills—with 1-click **Import Gaps from Latest JD Match**.
  - Persists saved roadmaps in PostgreSQL with interactive task checkboxes, milestone progress bars, and curated resource links.
- **Saved Collections, PDF Export & Dashboard Telemetry (`/library`, `/dashboard`, `/usage`, `/profile`)**
  - Organize questions into study collections, export multi-page PDF packets via `PDFKit`, track 30-day consistency streaks, and manage usage quotas.

---

## System Architecture & Tech Stack

### Monorepo Layout

```text
techquery-ai/
├── apps/
│   ├── web/            # React 19 SPA (Vite + TypeScript + Tailwind CSS v4 + Monaco Editor)
│   └── api/            # Modular Monolith REST API (Node.js + Express 5 + Prisma + PostgreSQL)
├── packages/
│   └── shared/         # Shared Zod schemas, DTO contracts, 100 Arena problems & 520 DSA sheet
└── docs/               # Architecture specs, system design, OpenAPI spec & release milestones
```

### Stack Details

| Layer | Technologies |
| :--- | :--- |
| **Frontend (`apps/web`)** | React 19, TypeScript, Vite, Tailwind CSS v4 ("Obsidian Precision" dark theme), `@monaco-editor/react`, TanStack Query v5, React Router v7, React Hook Form + Zod, Axios (single-flight 401 refresh), Lucide Icons |
| **Backend (`apps/api`)** | Node.js, Express 5, TypeScript, Prisma ORM (`PostgreSQL`), Pino structured logging, Multer, `pdf-parse`, `mammoth`, `pdfkit`, Judge0 CE HTTP adapter |
| **Shared (`packages/shared`)** | TypeScript + Zod domain contracts, 100 runnable coding problems with 20 test cases each, 520-problem DSA sheet dataset, 210 CS/SD/HR topic definitions |
| **AI Gateway** | Multi-provider `AIGateway` supporting **Groq Cloud** (`openai/gpt-oss-120b` / `openai/gpt-oss-20b`), local **Ollama** (`llama3.2:3b`), and deterministic offline fallbacks with `JsonSanitizer`, Zod validation, and 1-turn auto-repair |
| **Testing** | Vitest + Supertest (**355 API tests across 42 suites**) and Vitest + React Testing Library (**56 Web tests across 16 suites**) |

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
| `coding` | `/api/v1/coding` | 100 runnable LeetCode problems (2,000 test cases), Judge0 CE single-batch runner (`SAMPLE`/`SUBMIT`) |
| `assessments` | `/api/v1/assessments` | Refresh-safe `TIMED`/`UNTIMED` sessions, `draftsJson` autosave, `finish`/`cancel`/`delete` lifecycle |
| `dsa-sheet` | `/api/v1/dsa-sheet` | 520-problem sheet progress (`UNSOLVED`/`SOLVED`/`REVISION`), notes & multi-language AI walkthroughs |
| `cs-fundamentals` | `/api/v1/cs-fundamentals` | 210-topic CS Core, SD & Behavioral progress, notes & adaptive `DIAGRAM`/`CODE`/`STAR` AI guides |
| `roadmaps` | `/api/v1/roadmaps` | Dynamic AI learning roadmap generation, PostgreSQL milestone persistence & task toggling |
| `collections` | `/api/v1/collections` | Saved study collections & PDF packet export |
| `dashboard` / `usage` | `/api/v1/dashboard`, `/usage` | Unified 360° telemetry summary, 30-day activity heatmap & quota management |

---

## Security Engineering Highlights

- **In-Memory Access Tokens + Rotating `HttpOnly` Refresh Cookies:** Access JWTs (`15m`) stay strictly in memory; refresh tokens (`7d`) are stored as SHA-256 hashes in PostgreSQL with `HttpOnly` `SameSite=Lax` cookies, rotation, and reuse-detection revocation.
- **Sandboxed Remote Code Execution:** Untrusted user code is never executed locally with `child_process`; all runs route through `Judge0Adapter` (`JUDGE0_API_URL`) with `driverCode` wrapping, batch harness aggregation, and timeout guards.
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
Copy `.env.example` to `apps/api/.env` and configure your PostgreSQL URLs, JWT secret, AI provider, and Judge0 settings:

```env
DATABASE_URL=postgresql://techquery_runtime:password@127.0.0.1:5432/techquery_dev
MIGRATION_DATABASE_URL=postgresql://techquery_migrator:password@127.0.0.1:5432/techquery_dev
JWT_ACCESS_SECRET=your-minimum-32-character-secret-key-here
FRONTEND_URL=http://localhost:5173
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
JUDGE0_API_URL=https://ce.judge0.com
```

### 4. Generate Prisma Client & Apply Migrations
```bash
npm run db:generate
npm run db:migrate
```

### 5. Start Development Servers
```bash
# Terminal 1 - Backend API (Port 4000)
npm run dev:api

# Terminal 2 - Frontend SPA (Port 5173)
npm run dev --workspace=@techquery/web
```

### 6. Automated Verification
```bash
npm run test --workspace=@techquery/api    # 42 test suites, 355 tests passed (100%)
npm run test --workspace=@techquery/web    # 16 test suites, 56 tests passed (100%)
npm run typecheck                          # Zero TypeScript errors across all workspaces
npm run build                              # Monorepo production build verified
```
