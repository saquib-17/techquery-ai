# TechQuery AI — Architecture Decision Records (ADR Catalog)

**Document ID:** TQ-ADR-001  
**Version:** 1.0.0 (System Design Phase)  
**Author:** Principal Software Architect & Technical Lead  
**Status:** Approved for Implementation Planning  

---

## Index of Architectural Decisions

- [ADR-001: Modular Monolith Architecture Pattern](#adr-001-modular-monolith-architecture-pattern)
- [ADR-002: Relational PostgreSQL Engine with Prisma ORM](#adr-002-relational-postgresql-engine-with-prisma-orm)
- [ADR-003: Dual-Mode Architecture (Localhost Primary, Cloud Secondary)](#adr-003-dual-mode-architecture-localhost-primary-cloud-secondary)
- [ADR-004: Decoupled AI Gateway with Local Ollama & Groq Free Tier](#adr-004-decoupled-ai-gateway-with-local-ollama--groq-free-tier)
- [ADR-005: Dual-Token Authentication with Family Refresh Rotation](#adr-005-dual-token-authentication-with-family-refresh-rotation)
- [ADR-006: Asynchronous Queue — PostgreSQL SKIP LOCKED for Cloud Mode](#adr-006-asynchronous-queue--postgresql-skip-locked-for-cloud-mode)
- [ADR-007: Cloud File Storage — PostgreSQL Bytea & Supabase Free Storage](#adr-007-cloud-file-storage--postgresql-bytea--supabase-free-storage)
- [ADR-008: In-Browser Client-Side Pyodide WebAssembly for Code Execution](#adr-008-in-browser-client-side-pyodide-webassembly-for-code-execution)
- [ADR-009: Internal Schema Quotas & Demo Pro Toggle over Payment Gateways](#adr-009-internal-schema-quotas--demo-pro-toggle-over-payment-gateways)
- [ADR-010: Frontend Server State Management via TanStack Query](#adr-010-frontend-server-state-management-via-tanstack-query)

---

### ADR-001: Modular Monolith Architecture Pattern
- **Context:** The application needs a maintainable backend structure that operates reliably within Render's free 512MB RAM ceiling while demonstrating clean software engineering.
- **Options Considered:** (A) Microservices via Docker/Kubernetes, (B) Unstructured Single Express App, (C) Modular Monolith.
- **Decision:** Adopt a **Modular Monolith** in TypeScript on Express 5.
- **Reasoning:** Microservices introduce extreme operational overhead (networking latency, distributed tracing, high RAM usage) that fails immediately on free cloud tiers. An unstructured app leads to circular dependencies. A Modular Monolith enforces strict module boundaries (`src/modules/*`) with zero network latency and low memory usage (~140MB).
- **Trade-offs:** Modules must communicate via in-memory interfaces rather than direct internal database queries.
- **Consequences:** Easy local development, fits easily in 512MB RAM, simple transition to microservices if ever required.

---

### ADR-002: Relational PostgreSQL Engine with Prisma ORM
- **Context:** The legacy prototype used MongoDB with Mongoose.
- **Options Considered:** (A) Retain MongoDB, (B) MySQL, (C) PostgreSQL with Prisma ORM.
- **Decision:** Migrate entirely to **PostgreSQL 16+ managed via Prisma ORM**.
- **Reasoning:** Candidate resumes, skill gaps, question sets, and activity streaks form an intrinsically relational data graph. PostgreSQL enforces foreign keys, cascade deletes (crucial for DPDP compliance), and atomic transactions (`prisma.$transaction`). Native `JSONB` support provides document flexibility where needed.
- **Trade-offs:** Requires schema migrations (`prisma migrate`) instead of loose schema-less inserts.
- **Consequences:** Zero orphaned records, high query performance, identical local and cloud PostgreSQL dialects.

---

### ADR-003: Dual-Mode Architecture (Localhost Primary, Cloud Secondary)
- **Context:** Placement presentations in college auditoriums frequently fail due to spotty Wi-Fi, port firewalls, or cloud cold starts.
- **Options Considered:** (A) Cloud-Only Deployment, (B) Local-Only Application, (C) Dual-Mode Architecture.
- **Decision:** Implement **Dual-Mode Architecture** governed by `APP_MODE=local | cloud`.
- **Reasoning:** Mode A (Localhost) runs 100% offline with Ollama and local Postgres, guaranteeing zero-risk, sub-second placement presentations. Mode B (Cloud) deploys to Vercel and Render for a live portfolio URL.
- **Trade-offs:** Requires abstraction layers so drivers (storage, queues, AI) switch based on environment config.
- **Consequences:** Bulletproof interview presentation reliability paired with live public web presence.

---

### ADR-004: Decoupled AI Gateway with Local Ollama & Groq Free Tier
- **Context:** Commercial AI APIs (OpenAI, Claude) incur monetary costs and credit card requirements, violating the ₹0 project mandate.
- **Options Considered:** (A) Paid OpenAI API, (B) Hardcoded Groq SDK, (C) Decoupled AI Gateway supporting Ollama and Groq Free Tier.
- **Decision:** Build an abstracted **AI Gateway** defaulting to **Local Ollama (`llama3.2:3b`)** in Mode A and **Groq Cloud Free Tier (`llama-3.1-8b-instant`)** in Mode B, with Zod schema validation and cached DB fallbacks.
- **Reasoning:** Guarantees ₹0 operational cost, offline execution capability, and protection against vendor outages.
- **Trade-offs:** Local model inference depends on the developer machine's RAM/CPU.
- **Consequences:** Zero token expenses, resilient multi-turn generation, zero vendor lock-in.

---

### ADR-005: Dual-Token Authentication with Family Refresh Rotation
- **Context:** Securing candidate accounts against token theft (XSS) and session hijacking without paid auth services (Auth0, Clerk).
- **Options Considered:** (A) Long-lived localStorage JWT, (B) Stateful Server Sessions, (C) Dual-Token Hybrid (Short-lived JWT + HttpOnly Cookie).
- **Decision:** Implement **15-minute Access Tokens (in-memory)** paired with **7-day Refresh Tokens in HttpOnly, SameSite=Strict cookies with family reuse detection**.
- **Reasoning:** Inaccessible to client scripts via `document.cookie`, mitigating direct token exfiltration. Family rotation revokes all sessions if a consumed token is replayed (anti-theft).
- **Trade-offs:** HttpOnly cookies mitigate raw credential theft via script, but **do not render an application immune to XSS**; an attacker with script execution can still dispatch authenticated requests with credentials. Requires CSP, strict input validation, and auto-escaping.
- **Consequences:** Production-grade security profile compliant with OWASP Top 10 guidelines.

---

### ADR-006: Asynchronous Queue — PostgreSQL SKIP LOCKED for Cloud Mode
- **Context:** BullMQ polling over Upstash Redis Free Tier consumes 5,000–15,000 commands/day even when idle, burning Upstash's 10,000 daily limit in hours.
- **Options Considered:** (A) BullMQ on Upstash Redis, (B) Synchronous Request Execution, (C) PostgreSQL-backed Queue using `FOR UPDATE SKIP LOCKED`.
- **Decision:** Implement **PostgreSQL `SKIP LOCKED` Job Queue table (`job_queue`)** for Cloud Mode; reserve BullMQ for Local Mode.
- **Reasoning:** Zero Redis dependencies, zero command quota consumption, participating in atomic database transactions.
- **Trade-offs:** Requires a lightweight polling worker loop in the background.
- **Consequences:** Guarantees that public cloud deployments never fail due to Redis quota exhaustion.

---

### ADR-007: Cloud File Storage — PostgreSQL Bytea & Supabase Free Storage
- **Context:** Render's free container has an ephemeral disk that erases on restart. AWS S3 is paid and Cloudflare R2 requires a credit card.
- **Options Considered:** (A) Local disk on Render (data lost on restart), (B) Cloudflare R2 (requires credit card), (C) PostgreSQL Bytea Buffer or Supabase Storage Free Tier.
- **Decision:** Store resumes on **local disk (`./uploads`)** in Mode A; store as **compressed Bytea binary buffers directly in PostgreSQL** or in **Supabase Storage Free Tier (1GB, no credit card)** in Mode B.
- **Reasoning:** Resumes are small (250KB average). For the expected academic demo scale (50–100 resumes = 12.5MB–25MB), storing in PostgreSQL Bytea requires zero external cloud storage services and is immune to container spin-downs.
- **Trade-offs:** Storing binary files in PostgreSQL increases database backup size and memory usage during bulk queries. While an acceptable zero-cost trade-off for an academic portfolio, large-scale commercial deployments (> 100,000 resumes) would require dedicated external object storage.
- **Consequences:** 100% zero-cost document persistence with zero credit card requirements.

---

### ADR-008: In-Browser Client-Side Pyodide WebAssembly for Code Execution
- **Context:** Commercial code runners (Judge0 Enterprise) cost money. Running Docker daemons on free 512MB cloud instances causes immediate container crashes and security risks.
- **Options Considered:** (A) Paid Judge0 API, (B) Server Docker child process, (C) Client-side Pyodide (WebAssembly) in Web Worker.
- **Decision:** Execute Python code **entirely in the user's browser via Pyodide WebAssembly** inside an isolated Web Worker; JavaScript in a Web Worker sandbox; Java/C++ scoped to syntax editing and AI review.
- **Reasoning:** Consumes 0MB of backend container RAM, incurs ₹0 server compute costs, and completely eliminates server Remote Code Execution (RCE) vulnerabilities.
- **Trade-offs:** Client-side execution protects the *server*, not the client's own browser memory. An infinite loop or memory leak in the Web Worker can lag the user's browser tab until the 2.0s watchdog timer terminates the worker.
- **Consequences:** Zero server security liabilities, zero server hosting expenses, but limited to Python/JS for live execution.

---

### ADR-009: Internal Schema Quotas & Demo Pro Toggle over Payment Gateways
- **Context:** Demonstrating SaaS tier management during placement interviews without incurring merchant account, GST, or gateway fees.
- **Options Considered:** (A) Razorpay Integration, (B) Stripe Integration, (C) Internal Database Tier Schema with Interactive Demo Pro Toggle.
- **Decision:** Manage **Free and Pro tiers internally in PostgreSQL** (`users.tier = 'FREE' | 'PRO'`), with an interactive *"Activate Pro (Placement Demo Mode)"* button in the UI. No commercial payment gateways.
- **Reasoning:** Proves candidate's mastery of RBAC and quota management while preserving the ₹0 project mandate.
- **Trade-offs:** Does not process real credit cards (an intentional choice for an academic placement project).
- **Consequences:** Evaluators can test both Free limits and Pro features friction-free.

---

### ADR-010: Frontend Server State Management via TanStack Query
- **Context:** Managing remote asynchronous API data, caching, loading states, and optimistic UI updates in React 19.
- **Options Considered:** (A) Global Redux Store, (B) Ad-hoc `useEffect` and `useState`, (C) TanStack Query (React Query v5).
- **Decision:** Standardize on **TanStack Query v5**.
- **Reasoning:** Eliminates thousands of lines of boilerplate async thunk code. Provides automatic background refetching, window-focus revalidation, stale-while-revalidate caching, and built-in loading/error states.
- **Trade-offs:** Requires wrapping root application in `QueryClientProvider`.
- **Consequences:** Clean separation between server cache (TanStack Query), form state (React Hook Form), and auth state (React Context).
