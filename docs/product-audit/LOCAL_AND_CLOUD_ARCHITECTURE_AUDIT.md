# TechQuery AI — Local vs Cloud Architecture Audit Report

**Document ID:** TQ-AUDIT-004  
**Audit Date:** 2026-11-21  
**Auditor:** Senior SaaS Solutions Architect & DevOps Engineer  
**Scope:** Dual-Mode Operational Feasibility, Failure Modes, and Cloud Free-Tier Boundaries  

---

## 1. Architectural Model Overview

TechQuery AI is specifically designed around a **Dual-Mode Operational Architecture** to satisfy two conflicting requirements:
1. **Guaranteed zero-latency, zero-downtime demonstration** during high-stakes MCA placement presentations.
2. **Publicly accessible portfolio URL** on resumes and LinkedIn profiles.

```mermaid
flowchart TD
    subgraph Mode A: Local-First Placement Demo (100% Offline Capable)
        FE_A[Vite + React SPA on localhost:5173]
        BE_A[Node.js + Express on localhost:5000]
        DB_A[(Local PostgreSQL 16 - port 5432)]
        Ollama_A[Local Ollama localhost:11434]
        Storage_A[Local Disk: ./uploads]
        Worker_A[Local In-Process / BullMQ Queue]
        
        FE_A <--> BE_A
        BE_A <--> DB_A
        BE_A <--> Ollama_A
        BE_A <--> Storage_A
        BE_A <--> Worker_A
    end

    subgraph Mode B: Public Cloud Showcase (Permanent Free Cloud Tiers)
        FE_B[Vercel Edge CDN: *.vercel.app]
        BE_B[Render Free Web Service: *.onrender.com]
        DB_B[(Neon Serverless PostgreSQL Free Tier)]
        Groq_B[Groq Cloud Free Tier API]
        Storage_B[Supabase Storage Free / DB Bytea]
        Worker_B[In-Process Job Pool / DB Queue]
        
        FE_B <--> BE_B
        BE_B <--> DB_B
        BE_B <--> Groq_B
        BE_B <--> Storage_B
        BE_B <--> Worker_B
    end

    Note1[Local Ollama CANNOT be called by public Render backend]
    Note2[Local Mode guarantees 100% success in interview hall]
```

> **CRITICAL ARCHITECTURAL BOUNDARY:**  
> A publicly deployed backend on Render **CANNOT access local Ollama** on your laptop (unless exposed via an insecure reverse tunnel like ngrok). Therefore, the two modes must operate with distinct provider configurations governed by `APP_MODE`:
> - `APP_MODE=local`: Directs Node.js to `http://localhost:11434` (Ollama) and `postgres://localhost:5432/techquery`.
> - `APP_MODE=cloud`: Directs Node.js to Groq Cloud Free Tier and Neon Serverless PostgreSQL.

---

## 2. Mode A: Local Development & Placement Demo Audit

### 2.1 Hardware, Memory & Software Dependencies
- **Minimum Hardware:** 8GB RAM, 4 CPU cores, 10GB free disk space.
- **Recommended Hardware:** 16GB RAM, Apple M-series or modern Intel i5/i7/Ryzen 5/7, dedicated GPU (optional).
- **Software Dependencies:**
  - Node.js 20+ LTS
  - PostgreSQL 16 (Installed natively or via Docker)
  - Ollama runtime (`ollama serve`) with `ollama pull llama3.2:3b`
  - Git, npm

### 2.2 Offline Verification (Zero Internet Reliance)
- **Can all modules operate locally without internet access?**
  - **Auth:** Yes (Local bcrypt, local JWT signing, local session verification).
  - **Email Verification:** Yes. In local mode, verification links are **printed directly to the server terminal console** (`http://localhost:5173/verify-email?token=...`), enabling 1-click account verification without internet email delivery.
  - **Resume Parsing:** Yes. `pdf-parse` and `mammoth` run in-process memory.
  - **AI Generation & Answers:** Yes. Ollama runs on `localhost:11434` with zero external calls.
  - **Coding Practice:** Yes. Monaco Editor and Pyodide WebAssembly run in the local browser.
  - **PDF Export:** Yes. `jsPDF` compiles client-side in the browser.
- **Verdict for Mode A:** **100% OFFLINE CAPABLE.** Guaranteed protection against college auditorium Wi-Fi failures.

---

## 3. Mode B: Public Cloud Showcase Audit

### 3.1 Component Breakdown & Free-Tier Limits

| Layer | Provider | Free Tier Specification | Critical Risk & Operational Workaround |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | 100GB/mo, unlimited projects | Zero risk. Blazing fast edge caching of static Vite assets. |
| **Backend API** | Render | 512MB RAM, 0.1 CPU, 750 free hrs/mo | **Cold Start:** Inactive after 15m; 45s spin-up. **Workaround:** Client keep-warm loader banner. |
| **Database** | Neon Postgres | 0.5GB data, serverless auto-suspend | **Auto-Suspend:** Wakes in ~500ms. Connection pool managed via pgBouncer connection string. |
| **AI Inference** | Groq Cloud | 30 RPM, 14,400 RPD | **Rate Limiting:** Throttles over 30 RPM. **Workaround:** Fallback to Gemini 1.5 Flash Free + DB cache. |
| **Cache / Rate Limit** | Upstash Redis | 10,000 commands / day | **Command Burn:** BullMQ polling will burn 10k limit. **Workaround:** Use In-Memory Queue in Cloud Mode! |
| **File Storage** | Supabase Storage / DB Bytea | 1GB free / 500MB DB | **Ephemeral Disk:** Render disk wipes on restart. **Workaround:** Store PDF files in Supabase or as DB Bytea. |

### 3.2 Deep Dive: Render Free Host Constraints

1. **The 512MB RAM Ceiling:**
   - Exceeding 512MB causes Render to terminate the Node.js process immediately (Error 137 OOM).
   - **Protection Protocol:**
     - Node process configured with `--max-old-space-size=384`.
     - `pdf-parse` processes file buffers in streams and garbage-collects immediately.
     - Coding execution runs in the user's browser via Pyodide WebAssembly, consuming **0MB of Render RAM**.
2. **The 45-Second Cold Start:**
   - Free instances spin down after 15 minutes of zero inbound traffic.
   - **Protection Protocol:**
     - The React frontend Axios interceptor detects requests taking > 3.0s and displays an animated, reassuring status banner: *"Waking up free cloud backend instance... (approx. 30s). Thank you for your patience!"*.
     - For actual placement interviews, the candidate presents in **Mode A (localhost)**, achieving 0ms cold start.
3. **The Ephemeral Filesystem:**
   - Any file written to `./uploads` on Render is erased whenever the server spins down or redeploys.
   - **Protection Protocol:**
     - In Mode B, uploaded resumes are stored in **Supabase Storage Free Tier (1GB, zero credit card)** or stored directly as compressed **Bytea binary buffers in the PostgreSQL database**.

---

## 4. Operational Comparison Matrix: Local vs Cloud

| Dimension | Mode A: Local Placement Demo | Mode B: Public Cloud Showcase |
| :--- | :--- | :--- |
| **Primary Audience** | MCA placement evaluators, viva faculty | Recruiters clicking portfolio link on resume |
| **Internet Requirement** | **0% (100% offline capable)** | Requires active internet connection |
| **AI Inference Engine** | Ollama (`llama3.2:3b` / `qwen2.5:7b`) | Groq Free Tier (`llama-3.1-8b-instant`) |
| **Database Engine** | Local PostgreSQL 16 | Neon Serverless PostgreSQL |
| **Initial Latency** | **Sub-second (instant)** | 45-second cold start if container is asleep |
| **File Storage Medium**| Local disk (`./uploads`) | Supabase Storage Free Tier or DB Bytea |
| **Queue Mechanism** | BullMQ + Local Redis or In-Process | In-Process Worker Pool (`p-limit`) or DB Queue |
| **Email Verification** | Printed to server terminal console | Resend Free Tier (100 emails/day) |
| **Financial Cost** | **₹0.00** | **₹0.00** |

---

## 5. Architectural Verdict

**APPROVED.** The Dual-Mode architecture provides a bulletproof engineering foundation: Mode A guarantees placement presentation success without network friction, while Mode B provides an impressive live web demonstration for prospective employers.
