# TechQuery AI — Master Product Requirements Document (PRD)

**Document ID:** TQ-DOC-004  
**Version:** 2.0.0 (Zero-Cost Production Rebuild)  
**Status:** Approved for Implementation Planning  
**Author:** Product & Architecture Working Group  

---

## 1. Document Scope & Critical Constraint

This Master Product Requirements Document (PRD) establishes the functional boundaries, requirement hierarchies, system interactions, and verification criteria for **TechQuery AI**.

> **CRITICAL ARCHITECTURAL MANDATE: ₹0 ZERO-COST PRINCIPLE**  
> TechQuery AI is engineered as an elite showcase project for MCA placements and portfolio evaluation. The entire system must be developed, tested, demonstrated, and hosted at **strictly ₹0 cost**, utilizing open-source runtimes, local infrastructure (Ollama, local PostgreSQL/Redis), and permanent free cloud tiers. No paid APIs, paid databases, or paid payment processors are permitted.

---

## 2. Requirements Traceability Matrix

The table below catalogs all functional requirements, mapping them to strategic product pillars, prioritization tiers, and zero-cost delivery mechanisms.

| Req ID | Module / Feature Name | Strategic Pillar | Priority | Release | Zero-Cost Implementation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-001** | Production Authentication & Session Mgmt | Cross-Cutting | **P0** | V1 | Email verification (Resend Free / Console link), bcrypt, HttpOnly refresh cookies |
| **AUTH-002** | Google OAuth 2.0 Integration | Cross-Cutting | **P1** | V1 | Google Cloud Identity Free Tier (OAuth consent screen) |
| **ONBD-001** | Progressive User Profiling Wizard | Pillar 2 (Career) | **P0** | V1 | Stateful multi-step onboarding; 100% relational DB persistence |
| **RES-001** | Multi-Format Resume Parser (PDF/DOCX) | Pillar 1 (Interview) | **P0** | V1 | Open-source `pdf-parse` & `mammoth`, local disk or Supabase Free Storage |
| **RES-002** | ATS Quality & Actionable Audit | Pillar 2 (Career) | **P1** | V1 | Deterministic regex audits + Groq Free / Ollama qualitative critique |
| **JD-001** | Semantic Job Description Decomposition | Pillar 1 (Interview) | **P0** | V1 | Input sanitization, Zod schema extraction via Groq Free / Ollama |
| **MATCH-001**| Evidence-Based Match Scoring & Gap Analysis | Pillar 1 & 2 | **P0** | V1 | Hybrid scoring: deterministic taxonomy overlap + local/cloud LLM reasoning |
| **QGEN-001** | Context-Aware Question Synthesis | Pillar 1 (Interview) | **P0** | V1 | 10–20 categorized questions, intent tags via Groq Llama-3.1-8B or Ollama |
| **AGEN-001** | Multi-Tiered Answers & Complexity Analysis | Pillar 1 (Interview) | **P0** | V1 | Structured answers, complexity badges, cached in PostgreSQL |
| **MOCK-001** | Interactive Conversational Mock Interview | Pillar 3 (Simulator) | **P1** | V2 | Multi-turn stateful dialogue, text-based simulation via Redis/In-memory |
| **EVAL-001** | Multi-Dimensional Objective Evaluation Rubrics| Pillar 3 (Simulator) | **P1** | V2 | 4-dimension scoring, evidence-backed critique citing transcript excerpts |
| **CODE-001** | Sandboxed In-Browser Algorithmic Practice | Pillar 3 (Simulator) | **P2** | V3 | Client-side **Pyodide (WebAssembly)** + Web Workers (100% free, zero server load) |
| **CAREER-001**| Adaptive Career Readiness & Roadmap Engine | Pillar 2 (Career) | **P1** | V2 | Milestone sprint plans with direct Question Bank deep links |
| **DASH-001** | Data-Driven Preparation Command Center | Cross-Cutting | **P0** | V1 | Real database-aggregated stats, streak tracker, zero mock data |
| **LIB-001** | Question Collections, Tagging, & PDF Export| Pillar 1 (Interview) | **P0** | V1 | Custom folders, search/filter, client-side `jsPDF` styled downloads |
| **NOTIF-001**| Multi-Channel Preparation Notifications | Cross-Cutting | **P1** | V2 | Resend Free (100 emails/day) + in-app notification center |
| **BILL-001** | Multi-Tier Quota Tracking & Internal Tiers | Cross-Cutting | **P0** | V1 | Redis / in-memory counters, internal Demo Pro toggle (No Razorpay/Stripe) |

---

## 3. Product Success Metrics & Target KPIs (Zero-Cost Scope)

### 3.1 North Star Metric
> **Weekly Active Preparation Sessions (WAPS):** Measured in local or deployed environments as any unique user session completing question generation, roadmap milestones, or interview simulations within a rolling 7-day window.

### 3.2 Operational Performance Benchmarks (Free-Tier Calibrated)

| Dimension | Target Metric (Local Dev / Demo Mode) | Target Metric (Cloud Free-Tier Mode) | Measurement Method |
| :--- | :--- | :--- | :--- |
| **AI Generation Latency** | < 2.0s via Local Ollama | < 3.5s via Groq Cloud Free Tier | Internal APM stopwatch / OpenTelemetry |
| **Answer Cache Hit Ratio** | > 40% resolved from PostgreSQL | > 40% resolved from PostgreSQL | Relational DB cache hit counter |
| **Memory Footprint** | < 300MB RAM for Node.js API | Fits safely within 512MB RAM (Render free tier) | Node `process.memoryUsage()` telemetry |
| **Cold-Start Recovery** | 0ms (Local mode always on) | Polished UI keep-warm status banner | Client-side axios timeout interceptor |
| **Code Execution Overhead** | 0ms server compute | 100% client-side WebAssembly execution | Client-side performance API |

---

## 4. System Boundaries & Explicit Scope Exclusions

### 4.1 In-Scope for V1 (Zero-Cost MVP Foundation)
1. Complete authentication with email verification (Resend Free / Console bypass for local demos) and session security.
2. Progressive onboarding and user profile data store.
3. Native PDF and DOCX resume parsing via open-source `pdf-parse` and `mammoth` with local filesystem or Supabase free storage.
4. ATS quality audit and actionable bullet enhancement recommendations.
5. Job description decomposition into structured competencies.
6. Deterministic + Semantic hybrid matching with transparent gap reporting.
7. Context-aware question generation with difficulty, topic, and interviewer intent.
8. Model answer synthesis with time/space complexity analysis and permanent database persistence.
9. Question collection management and multi-page styled PDF exports via `jsPDF`.
10. Authentic metrics dashboard (active streaks, questions generated, topic progress).
11. Internal tier & quota management (Free vs Pro) demonstrated via in-app toggle without payment gateway dependencies.

### 4.2 Explicit Out-of-Scope Exclusions (Zero-Cost Mandate)
- ❌ **Commercial Payment Processors:** Zero integration with Razorpay, Stripe, or paid billing engines.
- ❌ **Paid Third-Party Code Runners:** Zero dependencies on Judge0 Enterprise or AWS Lambda; coding execution is powered strictly client-side via Pyodide WebAssembly.
- ❌ **Commercial AI APIs:** Zero dependencies on paid OpenAI/Claude endpoints; powered exclusively by Groq Free Tier and Local Ollama.
- ❌ **Paid Cloud Domains / SSL:** Deployed on standard free subdomains (`*.vercel.app`, `*.onrender.com`).
- ❌ **Heavy Video/Voice Streaming:** Voice is handled via browser-native Web Speech API (zero-cost) in V2; no third-party paid audio APIs.
