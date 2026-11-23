# TechQuery AI — Local & Cloud Deployment Guide

**Document ID:** TQ-ARCH-011  
**Version:** 1.0.0 (System Design Phase)  
**Author:** DevOps Engineer & Systems Architect  
**Status:** Approved for Implementation Planning  
**Operating Principle:** Dual-Mode (Localhost Primary, Cloud Secondary) at Strictly ₹0  

---

## 1. Operating Mode Overview

TechQuery AI is engineered to operate in two distinct modes configured via environment variables:
- **Mode A (Local-First):** Primary mode for local development and placement presentations. 100% offline-capable, runs on developer's laptop with zero cloud dependencies.
- **Mode B (Cloud Showcase):** Secondary mode for portfolio links on resumes/LinkedIn. Hosted on permanent free tiers.

---

## 2. Mode A: Local Deployment Blueprint (Primary)

```mermaid
flowchart LR
    Dev[Developer / Evaluator Machine] --> Browser[Browser: localhost:5173]
    Browser --> NodeAPI[Node.js Express: localhost:5000]
    NodeAPI --> LocalDB[(PostgreSQL 16: localhost:5432)]
    NodeAPI --> LocalOllama[Ollama Server: localhost:11434]
    NodeAPI --> LocalDisk[Local Directory: ./uploads]
```

### 2.1 Prerequisites & Installation
1. **Node.js:** v20.x LTS or higher.
2. **PostgreSQL:** v16.x installed natively or via Docker:
   ```bash
   docker run --name techquery-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=techquery_db -p 5432:5432 -d postgres:16-alpine
   ```
3. **Ollama:** Install from [ollama.com](https://ollama.com).
   Pull the approved lightweight model:
   ```bash
   ollama pull llama3.2:3b
   ```
   Start the Ollama server:
   ```bash
   ollama serve
   ```

### 2.2 Environment Configuration (`backend/.env.local`)
```ini
NODE_ENV="development"
PORT=5000
APP_MODE="local"
CLIENT_URL="http://localhost:5173"

# Database Connection (Local PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/techquery_db?schema=public"

# Authentication Secrets
JWT_ACCESS_SECRET="local_super_secret_access_key_1234567890"
JWT_REFRESH_SECRET="local_super_secret_refresh_key_0987654321"

# AI Inference Gateway (Local Ollama)
AI_PROVIDER="local"
OLLAMA_BASE_URL="http://localhost:11434"
AI_LOCAL_MODEL="llama3.2:3b"

# Storage
STORAGE_DRIVER="local"
LOCAL_UPLOAD_DIR="./uploads/resumes"
```

### 2.3 Application Startup Sequence
```bash
# 1. Setup Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run dev

# 2. Setup Frontend (in separate terminal)
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. All features operate with zero internet access.

---

## 3. Mode B: Cloud Showcase Deployment Blueprint (Secondary)

```mermaid
flowchart LR
    User[Recruiter / Evaluator] --> Vercel[Vercel Edge CDN: *.vercel.app]
    Vercel --> Render[Render Free Web Service: *.onrender.com]
    Render --> Neon[(Neon Serverless Postgres Free Tier)]
    Render --> Groq[Groq Cloud Free Tier API]
```

### 3.1 Cloud Infrastructure Setup (All Free Tiers Verified)
1. **Frontend Hosting (Vercel):**
   - Connect GitHub repository. Set root directory to `frontend`.
   - Build Command: `npm run build`; Output Directory: `dist`.
   - Set Environment Variable: `VITE_API_URL=https://techquery-backend.onrender.com/api/v1`.
2. **Database Hosting (Neon Serverless Postgres):**
   - Create free project on [neon.tech](https://neon.tech) (0.5GB free, no credit card).
   - Copy connection string (pooled connection with `?sslmode=require`).
3. **Backend API Hosting (Render):**
   - Create free Web Service on [render.com](https://render.com) (no credit card).
   - Set Build Command: `npm install && npx prisma migrate deploy && npm run build`.
   - Set Start Command: `node dist/server.js`.
   - Set Node options: `NODE_OPTIONS="--max-old-space-size=384"`.

### 3.2 Environment Configuration (`backend/.env.production`)
```ini
NODE_ENV="production"
PORT=10000
APP_MODE="cloud"
CLIENT_URL="https://techquery-ai.vercel.app"

# Database Connection (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample-123.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Authentication Secrets
JWT_ACCESS_SECRET="generate_strong_64_byte_random_secret"
JWT_REFRESH_SECRET="generate_strong_64_byte_random_secret"

# AI Inference Gateway (Groq Free Tier)
AI_PROVIDER="groq"
GROQ_API_KEY="gsk_free_tier_api_key_from_groq_console"
GROQ_MODEL="llama-3.1-8b-instant"

# Storage (Database Bytea Driver for Cloud)
STORAGE_DRIVER="database_bytea"
```

---

## 4. Cloud Free-Tier Operational Constraints & Verification Caveats

> **CRITICAL ZERO-COST CAVEAT:**  
> Free tiers offered by third-party cloud providers (Vercel, Render, Neon, Groq) are **NOT guaranteed to remain permanent**. Terms of service, resource limits, and free allowances can change at the vendor's discretion without notice.  
> The **Local-First Architecture (Mode A)** represents the only 100% self-sovereign, permanent zero-cost deployment that can never be revoked by external service changes.

| Cloud Service | Stated Free Allowance | Verified / Unverified Status | Operational Limitation | Architectural Safeguard |
| :--- | :--- | :---: | :--- | :--- |
| **Render Web Service** | 750 instance hours/month | Verified (2026) | 15-minute inactivity spin-down (45s cold start); 512MB RAM ceiling; ephemeral filesystem. | Frontend Axios keep-warm modal; memory capped via `--max-old-space-size=384`; resumes stored in DB Bytea. |
| **Neon Serverless Postgres** | 0.5 GB data storage | Verified (2026) | 5-minute compute auto-suspend (~500ms wake-up latency). | Handled transparently by Prisma connection pool retries. |
| **Vercel Hobby Tier** | 100 GB bandwidth/month | Verified (2026) | Non-commercial portfolio use only. | Fits student portfolio scope perfectly. |
| **Groq Cloud API** | 30 RPM / 14,400 RPD | **UNVERIFIED FOR PERMANENT AVAILABILITY** | Burst concurrency throttles with HTTP 429; model tags may deprecate. | AI Gateway fails over to Gemini 1.5 Flash Free or serves cached database sets. |

---

## 5. Explicit Operating Mode Matrix for V1 Features

To ensure architectural honesty, the platform distinguishes between two local deployment paradigms:
- **Paradigm 1: Fully Offline Operation:** Installed packages, pre-downloaded local Ollama model (`llama3.2:3b`), and local PostgreSQL. **Zero network calls are made.**
- **Paradigm 2: Local Application with Optional Internet AI:** Local Node.js + local PostgreSQL, but connecting to Groq / Gemini cloud APIs over internet.

> **IMPORTANT:** **These two modes are NOT equivalent.** Paradigm 1 provides true offline autonomy and data sovereignty; Paradigm 2 depends on internet connectivity, external provider uptime, and cloud rate limits.

| V1 Feature Module | Works Without Internet? | Requires Local Ollama? | Requires External AI? | Requires Cloud Host? | Supported in Mode A (Local)? | Supported in Mode B (Cloud)? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`AUTH-001` Registration & Login** | **YES** | No | No | No | **YES** (Console Link) | **YES** (Resend Free) |
| **`ONBD-001` Onboarding Wizard** | **YES** | No | No | No | **YES** | **YES** |
| **`RES-001` Document Text Extract**| **YES** | No | No | No | **YES** (`pdf-parse`) | **YES** (`pdf-parse`) |
| **`RES-001` Resume Structuring** | **YES** (Offline) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`RES-002` ATS Quality Audit** | **YES** (Offline) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`JD-001` JD Decomposition** | **YES** (Offline) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`MATCH-001` Gap Analysis** | **YES** (Offline) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`QGEN-001` Question Synthesis**| **YES** (Offline) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`AGEN-001` Model Answers** | **YES** (Offline) | **YES** (in Mode A) | Only in Mode B | No | **YES** (Ollama) | **YES** (Groq Free) |
| **`LIB-001` Collections & PDF** | **YES** | No | No | No | **YES** (`jsPDF`) | **YES** (`jsPDF`) |
| **`DASH-001` Dashboard & Streaks**| **YES** | No | No | No | **YES** (Local SQL) | **YES** (Neon SQL) |
| **`BILL-001` Demo Tier Toggle** | **YES** | No | No | No | **YES** | **YES** |

---

## 6. What Happens When Ollama Is Unavailable in Local Mode?

If the candidate runs TechQuery AI locally and Ollama is stopped or crashes:
1. **Generative Tasks Fail Gracefully:** Endpoints requiring new LLM inferences (`/questions/generate`, `/answers/generate`, `/resumes/upload`) return a controlled domain error:
   ```json
   {
     "success": false,
     "error": {
       "code": "OLLAMA_UNAVAILABLE",
       "message": "Local Ollama service is not responding on http://localhost:11434. Please run 'ollama serve' in your terminal."
     }
   }
   ```
2. **Non-Generative Tasks Remain 100% Operational:**
   - Logging in, registering, and browsing candidate profile.
   - Reading previously saved resumes and viewing cached ATS audit reports.
   - Inspecting previously generated question sets and reading saved model answers.
   - Creating, organizing, and exporting Question Collections to PDF via `jsPDF`.
   - Reviewing preparation dashboard streaks and activity charts.
3. **Zero Fake Generation:** The system **never silently generates fake or mocked AI responses** pretending Ollama ran successfully. Real errors are clearly surfaced to the user.
