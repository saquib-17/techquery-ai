# TechQuery AI

**AI-Powered Career Preparation, Technical Interview Studio & ATS Intelligence Platform**

TechQuery AI is a zero-cost (`₹0`), full-stack TypeScript monorepo that helps software engineering candidates audit their resumes against ATS heuristics, decompose target job descriptions, quantify resume-to-JD skill gaps, generate context-aware technical & behavioral interview sets, rehearse with structured STAR/code model answers, and export branded PDF study packets.

---

## Key Capabilities

- **Resume Management & AI ATS Audit (`/resumes`)**
  - Upload PDF or DOCX resumes (`pdf-parse` / `mammoth` text extraction + `5MB` validation).
  - Receive an overall `0–100` ATS score, section-by-section scoring (`contact`, `summary`, `experience`, `skills`, `education`), actionable bullet-point rewrites with one-click copy, and a structured career graph (`summary`, `skills`, `projects`, `experience`, `education`).
- **Job Description Intelligence (`/job-descriptions`)**
  - Paste any job posting to extract `roleTitle`, `seniority`, `experienceYears`, `mustHaveSkills`, `niceToHaveSkills`, `techStackCategories`, and `responsibilities`, with collapsible raw posting inspection.
- **Resume-to-JD Match & Skill-Gap Studio (`/matches`)**
  - Deterministic token-boundary skill matching + weighted scoring (`mustHaveSkills`, `niceToHaveSkills`, `experience`, `domain`) enriched with AI qualitative strengths, weaknesses, and actionable tailoring recommendations.
- **Question & Model Answer Studio (`/questions`)**
  - Generate `3–20` targeted questions across `THEORETICAL`, `CODING`, `SYSTEM_DESIGN`, `BEHAVIORAL`, and `PROJECT_DEFENSE` grounded in a selected resume, JD, or skill-gap match.
  - Slide-over **Model Answer Studio** with `INTERVIEW`, `CONCISE`, and `DETAILED` style switching, STAR behavioral breakdowns, dark-ink monospace code blocks with copy-to-clipboard, Big-O complexity badges, and common-mistakes callouts.
- **Saved Collections Library & PDF Export (`/library`)**
  - Bookmark questions into named study collections and export clean multi-page study packets streamed directly via `PDFKit`.
- **Preparation Streaks, Quotas & Simulated Plan Tiers (`/dashboard`, `/usage`, `/profile`)**
  - 30-day preparation consistency heatmap, 4-stage Interview Readiness Checklist, live monthly quota tracking, 1-click `FREE` ↔ `PRO` (`₹0` Demo Mode) tier switching, and a dedicated Candidate Profile & Session Security page.

---

## System Architecture & Tech Stack

### Monorepo Layout

```text
techquery-ai/
├── apps/
│   ├── web/            # React 19 SPA (Vite + TypeScript + Tailwind CSS v4)
│   └── api/            # Modular Monolith REST API (Node.js + Express + Prisma)
├── packages/
│   └── shared/         # Shared workspace contracts & utilities
├── docs/               # Product discovery, system design, OpenAPI spec & phase reports
├── infrastructure/     # Local PostgreSQL & service configuration
└── scripts/            # Database & verification utilities
```

### Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend (`apps/web`)** | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query v5, React Router v7, React Hook Form + Zod, Axios (single-flight 401 refresh), Lucide Icons |
| **Backend (`apps/api`)** | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Pino structured logging, Multer, `pdf-parse`, `mammoth`, `pdfkit` |
| **AI Gateway** | Provider-agnostic `AIGateway` supporting **Groq Cloud** (`openai/gpt-oss-20b` default), local **Ollama** (`llama3.2:3b`), and deterministic heuristic fallbacks with `<think>` / fence stripping, `JsonSanitizer`, Zod validation, and 1-turn auto-repair |
| **Testing** | Vitest + Supertest (API unit & integration) and Vitest + React Testing Library (Web) |

---

## Security Engineering Highlights

- **In-Memory Access Tokens + Rotating `HttpOnly` Refresh Cookies:** Access JWTs (`15m`) are kept strictly in memory (never `localStorage` or `sessionStorage`). Refresh tokens (`7d`) are stored as SHA-256 hashes in PostgreSQL, delivered via `HttpOnly` `SameSite=Lax` cookies scoped to `/api/v1/auth`, rotated on every refresh, and protected by token-family reuse detection.
- **Single-Flight Refresh Lock:** Frontend `AuthContext` and Axios response interceptors deduplicate concurrent `POST /api/v1/auth/refresh` calls (including React 19 `<StrictMode>` double-mounts) so rotation never triggers false reuse revocation.
- **CSRF & HTTP Hardening:** `validateSameOrigin` checks `Origin` / `Referer` against `FRONTEND_URL` on cookie-authenticated state-changing endpoints; `helmet`, strict CORS, and tiered rate limiting protect public and authenticated routes.
- **Input Validation & Least-Privilege DB Roles:** All request bodies, params, and AI outputs are validated with Zod; runtime queries use the least-privilege `techquery_runtime` PostgreSQL role while schema migrations use `techquery_migrator`.

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

Copy the example environment file and configure your PostgreSQL connection and AI provider:

```bash
cp apps/api/.env.example apps/api/.env
```

Key variables in `apps/api/.env`:
- `DATABASE_URL` — PostgreSQL runtime connection string
- `MIGRATION_DATABASE_URL` — PostgreSQL migration connection string (if using separate roles)
- `JWT_ACCESS_SECRET` — Minimum 32-character secret
- `FRONTEND_URL` — `http://localhost:5173`
- `AI_PROVIDER` — `groq`, `ollama`, or `mock`
- `GROQ_API_KEY` & `GROQ_MODEL=openai/gpt-oss-20b` (when using Groq)

### 4. Generate Prisma Client & Run Migrations

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start Development Servers

Run the API (`http://localhost:4000`) and Web SPA (`http://localhost:5173`, proxying `/api` to `:4000`) in separate terminals:

```bash
npm run dev:api
npm run dev --workspace=@techquery/web
```

### 6. Verification Commands

```bash
npm run test --workspace=@techquery/api
npm run test --workspace=@techquery/web
npm run typecheck
npm run build
```
