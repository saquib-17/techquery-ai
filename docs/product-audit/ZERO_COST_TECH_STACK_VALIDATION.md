# TechQuery AI — Zero-Cost Tech Stack Validation Report

**Document ID:** TQ-AUDIT-002  
**Audit Date:** 2026-11-21  
**Auditor:** Senior SaaS Solutions Architect & DevOps Engineer  
**Scope:** Exhaustive Technology-by-Technology Validation across All Layers  

---

## 1. Frontend Technologies

### 1.1 React 19, TypeScript, Vite 7, Tailwind CSS v4
1. **Genuinely usable without payment?** Yes. 100% open-source (MIT License).
2. **Requires a credit card?** No.
3. **Usage limits?** None. Runs locally in Node.js runtime and builds into static HTML/JS/CSS.
4. **Free tier expires?** No.
5. **Resource restrictions?** Governed only by local developer hardware or hosting edge CDN bandwidth.
6. **Suitable for this project?** Highly suitable. Vite provides near-instant HMR (hot module replacement) and optimized build bundles. React 19 offers modern hooks and performance.
7. **Free local alternative?** N/A (Already 100% free local technology).
8. **What happens if unavailable?** npm packages are cached locally; application builds completely offline.

### 1.2 shadcn/ui & Lucide React & Framer Motion
1. **Genuinely usable without payment?** Yes. Open-source libraries copied directly into source code (`shadcn/ui`) or installed via npm.
2. **Requires a credit card?** No.
3. **Usage limits?** None.
4. **Free tier expires?** No.
5. **Resource restrictions?** Zero. Client-side rendering only.
6. **Suitable for this project?** Highly suitable. Provides accessible, polished UI components suitable for portfolio demonstration.
7. **Free local alternative?** N/A.
8. **What happens if unavailable?** Code lives inside the git repository.

---

## 2. Backend Technologies

### 2.1 Node.js 20+ LTS, Express 5, TypeScript
1. **Genuinely usable without payment?** Yes. Open-source standard backend stack.
2. **Requires a credit card?** No.
3. **Usage limits?** None.
4. **Free tier expires?** No.
5. **Resource restrictions?** When hosted on Render Free Tier, container is restricted to 512MB RAM and ~0.1 CPU core. Locally, utilizes full developer machine capacity.
6. **Suitable for this project?** Highly suitable. Monolithic Express architecture keeps memory footprint under 200MB, well within Render's 512MB ceiling.
7. **Free local alternative?** N/A.
8. **What happens if unavailable?** Offline local execution available immediately.

---

## 3. Database & ORM

### 3.1 PostgreSQL 16 & Prisma ORM
1. **Genuinely usable without payment?** Yes. PostgreSQL is open-source (PostgreSQL License); Prisma is open-source (Apache 2.0).
2. **Requires a credit card?** No.
3. **Usage limits?**
   - **Local Mode:** Unlimited (governed by local hard drive space).
   - **Cloud Mode (Neon Serverless Postgres Free Tier):** 0.5GB data storage, 1 compute project.
   - **Cloud Mode (Supabase Free Tier Alternative):** 500MB database storage, 2 active projects.
4. **Free tier expires?** Neon and Supabase offer permanent free tiers with zero expiration.
5. **Resource restrictions?** Neon compute auto-suspends after 5 minutes of inactivity; wakes up automatically on the next connection in ~500ms–1s.
6. **Suitable for this project?** Extremely suitable. The domain model is relational. 0.5GB is massive for textual interview questions (stores ~200,000 questions and 5,000 resumes).
7. **Free local alternative?** Local PostgreSQL running natively or via Docker (`postgres:16-alpine`).
8. **What happens if unavailable?** In Mode A, local PostgreSQL operates with zero network dependencies.

---

## 4. AI Subsystem

### 4.1 Ollama (Local Model Inference)
1. **Genuinely usable without payment?** Yes. 100% open-source local inference engine.
2. **Requires a credit card?** No.
3. **Usage limits?** None. Completely unlimited local tokens.
4. **Free tier expires?** No.
5. **Resource restrictions?** Depends on host laptop RAM/VRAM.
   - `llama3.2:3b`: Requires ~2.2GB RAM (CPU runnable).
   - `qwen2.5-coder:7b`: Requires ~5.5GB RAM (CPU/GPU).
6. **Suitable for this project?** Crucial for placement demos. Eliminates Wi-Fi failure risk in interview halls.
7. **Free local alternative?** This IS the local alternative.
8. **What happens if unavailable?** If Ollama process is killed, AI Gateway switches to cached fallback datasets in PostgreSQL.

### 4.2 Groq Cloud Free Tier API
1. **Genuinely usable without payment?** Yes. Provides a permanent free developer tier.
2. **Requires a credit card?** **No credit card required** to sign up and generate an API key.
3. **Usage limits?**
   - 30 Requests Per Minute (RPM).
   - 14,400 Requests Per Day (RPD).
   - 6,000 Tokens Per Minute (TPM) on `llama-3.1-8b-instant`.
4. **Free tier expires?** Currently permanent developer tier (verified 2026).
5. **Resource restrictions?** Strict RPM limits; burst concurrency of > 30 requests throttles with HTTP 429.
6. **Suitable for this project?** Highly suitable for public cloud deployment. P95 latency is sub-2.0s.
7. **Free local alternative?** Local Ollama.
8. **What happens if unavailable?** AI Gateway circuit breaker trips to Google Gemini 1.5 Flash Free Tier or serves cached DB sets.

---

## 5. Background Processing & Caching

### 5.1 Redis & BullMQ
1. **Genuinely usable without payment?** Yes locally; with critical limitations in cloud.
2. **Requires a credit card?** No for local Docker; No for Upstash Redis Free Tier.
3. **Usage limits?**
   - **Local Redis:** Unlimited.
   - **Upstash Cloud Redis:** **10,000 commands per day**.
4. **Free tier expires?** Upstash free tier is permanent.
5. **Resource restrictions?** **CRITICAL AUDIT FINDING:** BullMQ uses polling mechanisms that consume thousands of Redis commands even while idle. Running standard BullMQ over Upstash Free Tier will exhaust the 10,000 daily commands in less than 24 hours.
6. **Suitable for this project?**
   - **Mode A (Local):** Suitable (Local Redis has no command limits).
   - **Mode B (Cloud):** **NOT SUITABLE IN DEFAULT BULLMQ CONFIGURATION**.
7. **Free local alternative?** Local Redis via Docker.
8. **What happens if unavailable?** **MANDATORY CORRECTION:** In Cloud Mode, the application must use an **In-Process Worker Pool (`p-limit`)** or **PostgreSQL-backed Job Queue Table (`SKIP LOCKED`)**, reserving Upstash Redis strictly for lightweight rate limiting and caching.

---

## 6. Storage & Document Extraction

### 6.1 `pdf-parse` & `mammoth` (Document Extraction)
1. **Genuinely usable without payment?** Yes. 100% open-source Node.js libraries.
2. **Requires a credit card?** No.
3. **Usage limits?** None.
4. **Free tier expires?** No.
5. **Resource restrictions?** Scanned image PDFs cannot be parsed (requires OCR). The application must reject scanned PDFs with a friendly error rather than crashing.
6. **Suitable for this project?** Highly suitable for native text-based PDF/DOCX resumes.
7. **Free local alternative?** N/A.
8. **What happens if unavailable?** Local code; always available.

### 6.2 File Storage: Local Filesystem vs Cloud Object Storage
1. **Genuinely usable without payment?** Yes.
2. **Requires a credit card?**
   - Local Disk: No.
   - Supabase Storage: No credit card required (1GB free).
   - Cloudflare R2: **Requires credit card on account setup** (even though 10GB is free).
   - PostgreSQL Bytea: No.
3. **Usage limits?** Supabase Storage: 1GB free; PostgreSQL Bytea: within 500MB DB cap.
4. **Free tier expires?** No.
5. **Resource restrictions?** Render's filesystem is ephemeral. Files saved to Render disk disappear on restart.
6. **Suitable for this project?**
   - **Local Mode:** Local filesystem (`./uploads`).
   - **Cloud Mode:** **Supabase Storage (Free Tier)** or **Base64 / Bytea in PostgreSQL**.
7. **Free local alternative?** Local disk.
8. **What happens if unavailable?** Database fallback storage guarantees zero file loss.

---

## 7. Code Execution Sandbox

### 7.1 Client-Side Pyodide (Python WebAssembly) & Web Workers
1. **Genuinely usable without payment?** Yes. 100% open-source WebAssembly distribution of Python.
2. **Requires a credit card?** No.
3. **Usage limits?** None. Executes on the user's browser CPU/RAM.
4. **Free tier expires?** No.
5. **Resource restrictions?** Browser security prevents socket connections and raw filesystem access (an intentional security feature).
6. **Suitable for this project?** Extremely suitable for Python algorithmic problem practice. Consumes 0MB of backend container RAM.
7. **Free local alternative?** N/A (Runs client-side).
8. **What happens if unavailable?** Hosted via Vercel edge bundle or CDN (`cdn.jsdelivr.net/pyodide`).

---

## 8. Deployment Infrastructure

### 8.1 Vercel (Frontend Hosting)
1. **Genuinely usable without payment?** Yes. Vercel Hobby Tier is permanently free for personal and non-commercial projects.
2. **Requires a credit card?** No.
3. **Usage limits?** 100GB bandwidth/month; 100 deployments/day.
4. **Free tier expires?** No.
5. **Resource restrictions?** Static site / edge hosting.
6. **Suitable for this project?** Ideal for React/Vite SPAs.
7. **Free local alternative?** `localhost:5173`.
8. **What happens if unavailable?** Cloudflare Pages or Netlify free tier as instant backup.

### 8.2 Render (Backend API Hosting)
1. **Genuinely usable without payment?** Yes. Free Web Service tier.
2. **Requires a credit card?** **No credit card required** for free web services.
3. **Usage limits?** 750 free instance hours per month (sufficient for 1 continuous web service).
4. **Free tier expires?** Permanent free tier.
5. **Resource restrictions?** **512MB RAM, 0.1 CPU core**. Spins down after 15 minutes of inactivity; 45–50s cold start. Ephemeral disk.
6. **Suitable for this project?** Suitable with documented cold-start handling and memory optimization.
7. **Free local alternative?** Localhost Node.js execution.
8. **What happens if unavailable?** Localhost presentation mode.

---

## 9. Comprehensive Tech Stack Validation Summary

| Component | Selected Technology | Status | Zero-Cost Feasibility |
| :--- | :--- | :---: | :---: |
| **Frontend Framework** | React 19 + TypeScript + Vite | **APPROVED** | 100% Free |
| **UI Components** | Tailwind CSS v4 + shadcn/ui | **APPROVED** | 100% Free |
| **Backend API** | Node.js + Express 5 (Modular Monolith) | **APPROVED** | 100% Free |
| **Relational Database** | PostgreSQL 16 + Prisma ORM | **APPROVED** | 100% Free |
| **Local AI Engine** | Ollama (`llama3.2:3b` / `qwen2.5-coder:7b`) | **APPROVED** | 100% Free |
| **Cloud AI Engine** | Groq Cloud Free Tier (`llama-3.1-8b-instant`) | **APPROVED** | 100% Free |
| **Code Execution** | Pyodide WebAssembly (Python in Web Worker) | **APPROVED** | 100% Free |
| **Frontend Deployment**| Vercel Hobby Tier | **APPROVED** | 100% Free |
| **Backend Deployment** | Render Free Web Service | **APPROVED (WITH WORKAROUND)** | 100% Free |
| **Database Cloud Host**| Neon Serverless Postgres | **APPROVED** | 100% Free |
| **Queue in Cloud Mode** | In-Process / PostgreSQL Job Queue | **REPLACED BULLMQ ON UPSTASH**| 100% Free |
| **Cloud File Storage** | Supabase Storage / DB Bytea | **REPLACED CLOUDFLARE R2** | 100% Free |
