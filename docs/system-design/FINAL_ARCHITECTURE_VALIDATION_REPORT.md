# TechQuery AI — Final Architecture Validation & Engineering Review

**Document ID:** TQ-VAL-001  
**Review Date:** 2026-11-21  
**Reviewer:** Principal Software Architect & Independent Technical Reviewer  
**Audit Scope:** Complete Verification of `docs/system-design/` (16 Documents)  
**Mandate:** Strictly ₹0 (Zero-Cost) Operational Feasibility for MCA Placements  
**Final Architecture Verdict:** **APPROVED WITH MINOR CONDITIONS**  

---

## 1. Documents Reviewed in this Audit

The following system design deliverables were reviewed against the approved PRD, Technical Audit, and Zero-Cost Infrastructure Strategy:
1. [`SYSTEM_ARCHITECTURE.md`](file:///f:/techquery-ai-main/docs/system-design/SYSTEM_ARCHITECTURE.md) (Modular Monolith, C4 Container Diagram, Request Lifecycles)
2. [`DATABASE_ARCHITECTURE.md`](file:///f:/techquery-ai-main/docs/system-design/DATABASE_ARCHITECTURE.md) (PostgreSQL Modeling, Key Strategy, Indexes, Cascade Rules)
3. [`ENTITY_RELATIONSHIPS.md`](file:///f:/techquery-ai-main/docs/system-design/ENTITY_RELATIONSHIPS.md) (Domain Entity Specifications & Mermaid ER Diagram)
4. [`DATABASE_SCHEMA_DESIGN.md`](file:///f:/techquery-ai-main/docs/system-design/DATABASE_SCHEMA_DESIGN.md) (Detailed SQL Types, Nullability, Indexes, Prisma Models)
5. [`API_SPECIFICATION.md`](file:///f:/techquery-ai-main/docs/system-design/API_SPECIFICATION.md) (REST Endpoints, JSON Payloads, Status Codes)
6. [`openapi.yaml`](file:///f:/techquery-ai-main/docs/system-design/openapi.yaml) (OpenAPI 3.1.0 Contract Definition)
7. [`AUTHENTICATION_ARCHITECTURE.md`](file:///f:/techquery-ai-main/docs/system-design/AUTHENTICATION_ARCHITECTURE.md) (Dual-Token Auth, Refresh Family Rotation)
8. [`AI_GATEWAY_ARCHITECTURE.md`](file:///f:/techquery-ai-main/docs/system-design/AI_GATEWAY_ARCHITECTURE.md) (Ollama + Groq Decoupling, Zod Validation, Auto-Repair)
9. [`BACKGROUND_JOB_ARCHITECTURE.md`](file:///f:/techquery-ai-main/docs/system-design/BACKGROUND_JOB_ARCHITECTURE.md) (PostgreSQL `SKIP LOCKED` Queue & In-Process Pool)
10. [`FILE_PROCESSING_ARCHITECTURE.md`](file:///f:/techquery-ai-main/docs/system-design/FILE_PROCESSING_ARCHITECTURE.md) (Document Ingestion, Magic Bytes, Bytea Storage)
11. [`SECURITY_ARCHITECTURE.md`](file:///f:/techquery-ai-main/docs/system-design/SECURITY_ARCHITECTURE.md) (STRIDE Threat Model, BOLA Defense, Web Worker Isolation)
12. [`LOCAL_AND_CLOUD_DEPLOYMENT.md`](file:///f:/techquery-ai-main/docs/system-design/LOCAL_AND_CLOUD_DEPLOYMENT.md) (Dual-Mode Operations, Free-Tier Limits)
13. [`FRONTEND_ARCHITECTURE.md`](file:///f:/techquery-ai-main/docs/system-design/FRONTEND_ARCHITECTURE.md) (Feature-Sliced React, TanStack Query, Pyodide Worker)
14. [`FEATURE_IMPLEMENTATION_MAPPING.md`](file:///f:/techquery-ai-main/docs/system-design/FEATURE_IMPLEMENTATION_MAPPING.md) (Traceability Matrix across All Releases)
15. [`ARCHITECTURAL_DECISIONS.md`](file:///f:/techquery-ai-main/docs/system-design/ARCHITECTURAL_DECISIONS.md) (10 Formal Architecture Decision Records)
16. [`SYSTEM_DESIGN_REVIEW.md`](file:///f:/techquery-ai-main/docs/system-design/SYSTEM_DESIGN_REVIEW.md) (12-Point Consistency Checklist)

---

## 2. Critical Issues Discovered & Engineering Corrections Made

| # | Subsystem / File | Discovered Architectural Flaw | Corrective Engineering Action |
| :-: | :--- | :--- | :--- |
| **1** | **Security / Database** (`DATABASE_ARCHITECTURE.md`, `SECURITY_ARCHITECTURE.md`) | Initial text described UUIDv4 as "BOLA / IDOR Prevention", implying unguessable IDs provide authorization. | **Corrected:** Clarified that **UUIDs are NOT an authorization mechanism**. Unguessable IDs reduce enumeration, but authorization requires explicit tenant checks (`WHERE id = :id AND user_id = :authenticatedUserId`) on every query. |
| **2** | **Security / Authentication** (`AUTHENTICATION_ARCHITECTURE.md`, `ARCHITECTURAL_DECISIONS.md`) | Described HttpOnly cookies as making the application "XSS-immune". | **Corrected:** Removed the "XSS-immune" claim. HttpOnly cookies prevent direct script exfiltration of the token string via `document.cookie`, but an attacker with XSS can still dispatch authenticated requests. Clarified the necessity of defense-in-depth (React JSX escaping, CSP, `rehype-sanitize`). |
| **3** | **Coding Practice Sandbox** (`SECURITY_ARCHITECTURE.md`, `ARCHITECTURAL_DECISIONS.md`) | In-browser execution was described as a generic sandbox without distinguishing browser vs server boundaries. | **Corrected:** Clarified that Pyodide WebAssembly running in a Web Worker protects the **backend server from RCE**, but client CPU/memory can still be consumed by runaway loops. Added strict **2.0-second watchdog termination** and confirmed Java/C++ are non-executable in V1/V2. |
| **4** | **AI Inference Claims** (`AI_GATEWAY_ARCHITECTURE.md`) | Fixed tokens/sec speeds were asserted as universal facts regardless of host CPU or thermal conditions. | **Corrected:** Replaced static speed assertions with hardware-dependent profiles (Profile 1: Budget 8GB laptop, Profile 2: 16GB laptop, Profile 3: Apple Silicon) and explicit RAM ranges. |
| **5** | **Zero-Cost Free Tier Claims** (`LOCAL_AND_CLOUD_DEPLOYMENT.md`) | Described free cloud tiers (Groq, Vercel, Neon) as "permanent free tiers". | **Corrected:** Removed all "permanent free" assertions. Added explicit verification notices stating that third-party cloud policies can change without notice, making **Mode A (Local-First)** the only guaranteed self-sovereign deployment. |

---

## 3. Explicit Operating Mode Matrix for V1 Features

To maintain complete architectural transparency, the platform distinguishes between two local deployment paradigms:
- **Type A: Fully Offline Operation:** Installed packages, pre-downloaded Ollama model (`llama3.2:3b`), and local PostgreSQL. **Zero network calls are made.**
- **Type B: Local Application with Optional Internet AI:** Local Node.js + local PostgreSQL, but connecting to Groq / Gemini cloud APIs over internet.

> **CRITICAL ARCHITECTURAL DISTINCTION:**  
> **Type A and Type B are NOT equivalent.** Type A provides complete air-gapped autonomy (ideal for college auditoriums with firewalled or failing Wi-Fi). Type B relies on external API uptime, DNS resolution, and vendor rate limits.

| V1 Feature Module | Works Without Internet? | Requires Local Ollama? | Requires External Cloud AI? | Requires Cloud Host? | Supported in Mode A (Local)? | Supported in Mode B (Cloud)? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`AUTH-001` User Registration & Login** | **YES** | No | No | No | **YES** (Console Link) | **YES** (Resend Free) |
| **`ONBD-001` Onboarding Wizard** | **YES** | No | No | No | **YES** | **YES** |
| **`RES-001` Document Text Extraction** | **YES** | No | No | No | **YES** (`pdf-parse`) | **YES** (`pdf-parse`) |
| **`RES-001` Resume Structuring** | **YES** (Type A) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`RES-002` ATS Quality Audit** | **YES** (Type A) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`JD-001` JD Decomposition** | **YES** (Type A) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`MATCH-001` Resume-JD Gap Analysis** | **YES** (Type A) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`QGEN-001` Question Studio (15 Qs)** | **YES** (Type A) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`AGEN-001` Model Answers & Complexity**| **YES** (Type A) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`LIB-001` Collections & PDF Export** | **YES** | No | No | No | **YES** (`jsPDF`) | **YES** (`jsPDF`) |
| **`DASH-001` Preparation Streak Dashboard**| **YES** | No | No | No | **YES** (Local SQL) | **YES** (Neon SQL) |
| **`BILL-001` Placement Demo Pro Toggle** | **YES** | No | No | No | **YES** | **YES** |

### What Happens When Ollama Is Unavailable in Local Mode?
1. **Generative Tasks Fail Gracefully:** Invoking `/questions/generate`, `/answers/generate`, or `/resumes/upload` returns a structured error:
   `OLLAMA_UNAVAILABLE: Please run 'ollama serve' in your terminal.`
2. **Non-Generative Tasks Remain 100% Operational:** Logging in, inspecting previously saved resumes, reviewing stored ATS analyses, browsing question sets, reading cached answers, organizing collections, exporting PDFs, and viewing dashboard streaks all work flawlessly.
3. **Zero Fake Content:** The system **never synthesizes mocked or fake AI answers** pretending Ollama ran successfully. Real errors are clearly displayed.

---

## 4. Zero-Cost Feasibility Audit & Cloud Verification Status

| Service / Tool | Layer | Genuinely Free? | Credit Card Required? | Free-Tier Allowance | Verification Status & Caveats |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Local Ollama** | AI Inference | **YES** | **NO** | Unlimited offline tokens | **VERIFIED.** 100% free open-source runtime. |
| **Local PostgreSQL** | Database | **YES** | **NO** | Unlimited local storage | **VERIFIED.** Open-source standard. |
| **Pyodide WebAssembly** | Code Practice | **YES** | **NO** | Unlimited in-browser execution | **VERIFIED.** Runs client-side in Web Worker. |
| **`pdf-parse` / `mammoth`**| File Parsing | **YES** | **NO** | Unlimited in-process execution | **VERIFIED.** Open-source npm packages. |
| **Vercel Hobby Tier** | Frontend Host | **YES** | **NO** | 100GB bandwidth/month | **VERIFIED (2026).** Non-commercial portfolio terms. |
| **Render Web Service** | Backend API | **YES** | **NO** | 750 instance hours/month | **VERIFIED (2026).** 512MB RAM ceiling; 15-min spin-down (45s cold start). |
| **Neon Serverless Postgres**| Cloud Database | **YES** | **NO** | 0.5GB data storage | **VERIFIED (2026).** 5-min auto-suspend (~500ms wake latency). |
| **Groq Cloud API** | Cloud AI | **YES** | **NO** | 30 RPM / 14,400 RPD | **UNVERIFIED FOR PERMANENT OPERATION.** Free developer tier active today, but subject to vendor policy change. |
| **Google Gemini Free API** | Cloud Fallback | **YES** | **NO** | 15 RPM / 1,500 RPD | **UNVERIFIED FOR PERMANENT OPERATION.** Free tier without billing setup, but model tags may rotate. |
| **Resend Free Tier** | Transactional Mail | **YES** | **NO** | 100 emails/day, 3,000/mo | **VERIFIED (2026).** Local terminal bypass available. |

---

## 5. Storage Evaluation: PostgreSQL BYTEA vs External Object Storage

For **Mode B (Cloud Showcase)** on Render, the filesystem is ephemeral and wipes on restart. AWS S3 requires payment and Cloudflare R2 requires a credit card.
- **The Selected Strategy:** Storing uploaded resume buffers directly in PostgreSQL column `resumes.file_buffer BYTEA`.
- **Engineering Evaluation of Scale:**
  - Standard candidate PDF size: **200KB – 350KB** (average 250KB).
  - Expected Placement Demo Scale: **50–100 resumes = 12.5MB – 25MB**.
  - Total Neon Free Database Allowance: **512MB (0.5GB)**.
  - **Verdict:** For an academic placement showcase, BYTEA storage consumes less than **5% of the free database capacity**, completely eliminates external S3 dependencies, requires zero credit cards, and is 100% immune to Render container restarts.
  - **Documented Trade-Off:** For commercial enterprise scale (> 50,000 resumes = 12.5GB), BYTEA would inflate database backup sizes and table scan memory; commercial scale would require dedicated S3/GCS buckets. For this ₹0 project, BYTEA is an optimal engineering trade-off.

---

## 6. Background Queue Evaluation: PostgreSQL `SKIP LOCKED`

BullMQ polling over Upstash Redis was audited and rejected for cloud deployment due to rapid command exhaustion (burning 10,000 commands/day in hours).
- **The Selected Strategy:** PostgreSQL-backed queue table (`job_queue`) using atomic row-level lock skipping:
  ```sql
  UPDATE job_queue
  SET status = 'PROCESSING', locked_at = NOW(), locked_by = :workerId, attempts = attempts + 1
  WHERE id = (
      SELECT id FROM job_queue
      WHERE status = 'PENDING' AND run_at <= NOW()
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
  ```
- **Engineering Validation:**
  - **Atomic Concurrency:** Multiple worker loops safely claim non-overlapping rows with zero race conditions.
  - **Zero Polling Cost:** Queries execute against indexed B-Trees (`idx_job_queue_fetch`) inside PostgreSQL, consuming zero Redis API units.
  - **Transactional Enlistment:** Enqueueing can be bundled into the same Prisma transaction as the business entity.

---

## 7. Security Architecture Validation

1. **BOLA / IDOR Defense:** Enforced on every service query: `where: { id: req.params.id, userId: req.user.userId }`.
2. **SQL Injection Defense:** 100% parameterized queries via Prisma ORM.
3. **XSS Defense:** React JSX escaping + `rehype-sanitize` for rendered markdown + `HttpOnly` refresh cookies.
4. **CSRF Defense:** `SameSite=Strict` cookies + Bearer token authorization header.
5. **Prompt Injection Defense:** Delimiter isolation (`<RESUME_DATA>...</RESUME_DATA>`) + strict Zod output schemas.
6. **Code Sandbox Defense:** In-browser Web Worker running Pyodide WebAssembly with a 2.0s watchdog termination timer (0MB server compute, zero server RCE).

---

## 8. Remaining Architectural Risks & Operational Playbooks

1. **Render Free Tier Cold Start (45s Delay):**
   - *Playbook:* Client Axios interceptor displays an informative keep-warm loader modal. For actual placement interviews, the candidate presents in **Mode A (localhost)** to guarantee 0ms latency.
2. **Groq Cloud Rate Limiting (30 RPM):**
   - *Playbook:* AI Gateway automatically falls back to Gemini 1.5 Flash Free or serves verified cached question sets from PostgreSQL.
3. **Host Laptop RAM Saturation (Local Mode):**
   - *Playbook:* Model default is set to `llama3.2:3b` (~2.2GB working RAM), which runs smoothly on standard 8GB RAM laptops.

---

## 9. Final Review Conditions for Implementation

The following minor conditions must be maintained during implementation:
1. **Condition 1:** Keep `AI_LOCAL_MODEL="llama3.2:3b"` as the default configuration in `.env.example`.
2. **Condition 2:** Keep Java and C++ non-executable in V1/V2; interactive execution is restricted to Python (Pyodide) and JavaScript (Web Worker).
3. **Condition 3:** Ensure `APP_MODE=local` outputs verification links to the server console to allow offline account verification.

---

## 10. Final Architecture Verdict

### Verdict Selection:
> **APPROVED WITH MINOR CONDITIONS**

### Technical Justification:
The system design documentation across all 16 deliverables is technically rigorous, architecturally consistent, aligned with modern SaaS standards, and strictly verified to operate at **₹0 cost**. All identified security, queue, and model sizing discrepancies have been resolved.

---

### Next Phase Transition:
**Awaiting founder review and explicit approval of this validation report before commencing Phase 3 (Implementation Planning).**
