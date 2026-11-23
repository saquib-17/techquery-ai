# TechQuery AI — Architecture Decision Records (Zero-Cost Scope)

**Document ID:** TQ-DOC-011  
**Version:** 2.0.0 (Zero-Cost Rebuild)  
**Status:** Approved for Implementation  
**Author:** Technical Architecture & Systems Engineering Group  

---

## 1. Architecture Decision Records (ADRs)

### ADR-001: Architecture Pattern — Modular Monolith over Microservices
- **Status:** **APPROVED**
- **Context:** Deciding architecture style under a ₹0 budget and placement showcase requirements.
- **Decision:** Build a **Modular Monolith** in TypeScript (Node.js + Express).
- **Rationale:**
  - Microservices require multiple hosting containers, which would immediately exceed free-tier memory allowances (512MB RAM) and incur infrastructure costs.
  - A Modular Monolith allows the entire platform (API, background queues, AI gateway) to run within a single container in production or a single process locally.
  - Enforces clean domain boundaries (`src/modules/auth`, `src/modules/resume`, `src/modules/ai`, `src/modules/interview`) without DevOps complexity.

---

### ADR-002: Primary Database — PostgreSQL + Prisma ORM (Local + Free Serverless Cloud)
- **Status:** **APPROVED**
- **Context:** The legacy academic prototype used MongoDB Atlas with unvalidated Mongoose schemas.
- **Decision:** Migrate entirely to **PostgreSQL** managed with **Prisma ORM**.
- **Rationale:**
  - TechQuery AI's domain model is relational: `User` owns `Resumes`, which link to `JobMatches`, `QuestionSets`, `Questions`, `Answers`, and `InterviewSessions`.
  - Prisma migrations allow developers to switch seamlessly between **local PostgreSQL** (`localhost:5432`) and **free cloud PostgreSQL (Neon / Supabase)** by changing a single `.env` variable (`DATABASE_URL`).
  - Native `JSONB` support allows relational foreign key integrity alongside flexible storage for LLM schema outputs.

---

### ADR-003: AI Inference Gateway — Local Ollama + Groq Cloud Free Tier (₹0 Cost)
- **Status:** **APPROVED**
- **Context:** Commercial LLM APIs (OpenAI GPT-4o, Claude 3.5) require credit cards, incur ongoing token bills, and fail if credits run out.
- **Decision:** Build a provider-agnostic **AI Gateway** supporting:
  1. **Local Mode:** **Ollama** (`llama3.2:3b` / `qwen2.5-coder:7b`) running on `localhost:11434` for 100% offline, unlimited, free local execution during placement demos.
  2. **Cloud Mode:** **Groq Cloud Free Tier** (`llama-3.1-8b-instant`) with automatic fallback to **Google Gemini 1.5 Flash Free Tier**.
- **Rationale:** Guarantees that the application never incurs a single rupee of API costs and functions seamlessly even when offline.

---

### ADR-004: Code Execution Sandbox — Client-Side Pyodide (WebAssembly) over Server Sandbox
- **Status:** **APPROVED**
- **Context:** For the coding practice module, commercial sandbox runtimes (Judge0 Enterprise, AWS Lambda) cost money and running Docker daemons on free 512MB cloud hosts causes immediate crashes.
- **Decision:** Execute Python code **entirely in the user's browser using Pyodide (Python compiled to WebAssembly)** running in an isolated Web Worker.
- **Rationale:**
  - Zero server compute cost (runs on client's machine).
  - Consumes 0MB of backend container RAM, preventing server Out-Of-Memory crashes.
  - 100% air-gapped from backend server filesystems and databases (zero server RCE vulnerability).

---

### ADR-005: SaaS Monetization System — Internal Demo Gating over Payment Gateways
- **Status:** **APPROVED**
- **Context:** Demonstrating SaaS tier management during placement interviews without incurring merchant account, GST, or gateway fees.
- **Decision:** Implement **conceptual Free and Pro tiers internally in the database schema**, with an interactive *"Activate Pro (Placement Demo Mode)"* button in the UI. No Razorpay or Stripe integrations.
- **Rationale:**
  - Proves the candidate's understanding of SaaS tiering, RBAC, and quota management.
  - Allows placement interviewers to test both the Free limit blocks and the unlocked Pro features without credit cards.
  - Zero financial overhead or payment failure troubleshooting.

---

### ADR-006: Asynchronous Queue Architecture — In-Process / PostgreSQL Job Queue for Cloud Mode over BullMQ on Upstash
- **Status:** **APPROVED**
- **Context:** BullMQ polling over Upstash Redis Free Tier consumes 5,000–15,000 commands/day even while idle, exceeding Upstash's 10,000 daily command cap within hours.
- **Decision:** In **Mode B (Cloud Deployment)**, use an **In-Process Worker Pool (`p-limit`)** or a **PostgreSQL-backed Job Queue Table (`status = PENDING`, `FOR UPDATE SKIP LOCKED`)**. BullMQ + local Redis is reserved for **Mode A (Localhost)**.
- **Rationale:**
  - Prevents Upstash Redis command exhaustion and HTTP 429 errors in cloud deployment.
  - Keeps the entire cloud backend self-contained within Render's free tier without paid Redis dependencies.

---

### ADR-007: Cloud File Storage — Supabase Storage / DB Bytea over Cloudflare R2 / AWS S3
- **Status:** **APPROVED**
- **Context:** Render's free container has an ephemeral disk (wiped on restart). Cloudflare R2 requires a credit card to activate the account, and AWS S3 is a paid service.
- **Decision:** In **Mode A (Localhost)**, store resumes on local disk (`./uploads`). In **Mode B (Cloud)**, store resumes in **Supabase Storage Free Tier (1GB free, zero credit card)** or as compressed **Bytea binary buffers directly in PostgreSQL**.
- **Rationale:**
  - Strictly preserves the ₹0 zero-cost mandate and eliminates credit card requirements.
  - Resumes are small (average 250KB); storing them in Supabase or PostgreSQL DB Bytea guarantees zero data loss across Render cold-start container restarts.

---

## 2. Key Decisions Requiring Founder / Stakeholder Sign-Off

1. **Default Presentation Mode:**
   - *Recommendation:* Approve **Mode A (localhost)** as the primary live presentation setup for college evaluators to ensure 0ms network latency and zero dependence on college Wi-Fi, keeping the public Vercel/Render deployment as a secondary portfolio link.
2. **Cloud Free-Tier Selection:**
   - *Recommendation:* Select **Vercel** (Frontend) + **Render** (Backend) + **Neon** (Postgres) as the verified zero-cost public showcase stack.
3. **Local LLM Model Default:**
   - *Recommendation:* Set `llama3.2:3b` as the default local model in Ollama to guarantee smooth execution even on laptops with 8GB RAM.
