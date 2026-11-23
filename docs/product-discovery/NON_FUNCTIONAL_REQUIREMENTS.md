# TechQuery AI — Non-Functional Requirements (Zero-Cost Scope)

**Document ID:** TQ-DOC-007  
**Version:** 2.0.0 (Zero-Cost Rebuild)  
**Status:** Approved for Implementation Planning  
**Author:** Software Architecture & Quality Engineering Group  

---

## 1. Performance & Latency Budgets (Free-Tier Calibrated)

Performance budgets are realistically calibrated for **local developer machines** and **free-tier cloud hosts** (e.g., Render free 512MB RAM instances).

| Transaction / Endpoint | Local Mode (Ollama + Local DB) | Cloud Free-Tier Mode (Groq + Render) | Strategy & Free-Tier Constraint |
| :--- | :--- | :--- | :--- |
| **Auth Verification / Token Refresh** | < 25ms | < 80ms | In-memory token verification / DB index |
| **Dashboard Metrics Aggregation** | < 40ms | < 120ms | Single indexed SQL query in PostgreSQL |
| **Cached Question / Answer Fetch** | < 15ms | < 50ms | Key-indexed DB read (Zero AI call) |
| **New Question Set Generation** | < 2,200ms (Ollama 3.2 3B) | < 3,000ms (Groq Cloud) | Asynchronous BullMQ queue worker |
| **Client-Side Code Execution** | < 300ms (Pyodide Wasm) | < 300ms (Pyodide Wasm) | 100% in-browser client compute (Zero server RAM) |
| **Initial Bundle Load (FCP)** | < 600ms | < 1,500ms | Vite code-splitting + Vercel Global Edge CDN |

---

## 2. Infrastructure Footprint & Memory Sizing

### 2.1 Backend Memory Ceiling (< 512MB RAM)
- **Constraint:** Free web hosting instances (Render / Koyeb) cap container RAM at **512MB**. Exceeding this limit causes immediate Out-Of-Memory (OOM) process termination.
- **Mitigation Protocols:**
  - Node.js garbage collection tuned via `--max-old-space-size=384`.
  - Heavy document parsing (`pdf-parse`) operates on streaming buffers and releases file memory immediately.
  - Zero heavy in-process model runtimes (Ollama runs externally or on local host).
  - Heavy code compilation is offloaded to client-side WebAssembly (Pyodide).

### 2.2 Free Cloud Inactivity & Cold-Start Management
- **Constraint:** Render free services spin down after 15 minutes of zero traffic. Subsequent requests face a **45-second cold start**.
- **Mitigation Protocols:**
  - Client-side Axios interceptor detects slow initial responses and displays an informative loading banner: *"Waking up free cloud server... (approx. 30s). Thank you for your patience!"*.
  - For live placement demonstrations, the candidate switches to **Mode A (localhost)** to demonstrate instant sub-second responses.

---

## 3. Reliability, Availability & Graceful Degradation

- **Availability Target:**
  - **Local Mode:** 100% (Air-gapped, zero external dependencies).
  - **Cloud Free-Tier Mode:** 99.0% (Governed by Render free tier and Groq free tier uptime).
- **Graceful Failure Behavior:**
  - If Groq Free Tier hits rate limits (HTTP 429), the AI Gateway falls back to Gemini 1.5 Flash Free or serves verified cached question sets from PostgreSQL.
  - If Upstash Redis reaches its 10,000 daily command cap, the backend automatically transitions to an internal in-memory LRU cache (`node-cache`) with zero crash.

---

## 4. Security & Compliance (Zero-Cost Implementation)

### 4.1 Application Security (OWASP Top 10)
- **BOLA / IDOR:** Every query strictly enforces tenant isolation: `WHERE id = :id AND user_id = :authenticatedUserId`.
- **SQL Injection:** 100% parameterized queries via Prisma ORM; zero raw string concatenation.
- **XSS Prevention:** React JSX auto-escaping; user markdown rendered via `react-markdown` with `rehype-sanitize`.
- **Auth Security:** Passwords hashed with `bcrypt` (cost factor 10, balanced for 512MB RAM instances); HttpOnly, Secure, SameSite=Strict cookies for refresh tokens.

### 4.2 Sandboxed Code Execution Security (Zero-Server-Cost)
- Executing user code on a free 512MB server risks container crashes or RCE exploits.
- **Client-Side Sandbox:** Python is executed inside the user's browser via **Pyodide (WebAssembly)** running inside an isolated Web Worker.
- Completely air-gapped from backend servers, host filesystems, and databases. Zero server security liability.

### 4.3 Privacy & Indian DPDP Act 2023 Compliance
- **Consent Tracking:** Explicit consent checkbox during registration, logged in database.
- **Data Erasure:** Account deletion cascadingly deletes all uploaded files, parsed resumes, and activity logs.
- **Zero Public Training:** External inference calls (Groq / Gemini) enforce zero-retention / non-training parameters; Local Ollama guarantees 100% local data sovereignty.

---

## 5. Observability & Monitoring (Free-Tier Tools)

- **Structured Console Logging:** Standardized JSON log outputs (`timestamp`, `level`, `traceId`, `module`, `message`).
- **Health Check Endpoint:** `/api/health` performing connectivity checks across PostgreSQL, Redis, and AI Gateway status.
- **Free Error Tracking:** Sentry Developer Free Tier (5,000 errors/month free) or console error logging.
