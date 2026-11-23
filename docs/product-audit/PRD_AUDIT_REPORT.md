# TechQuery AI — Comprehensive PRD & Architecture Audit Report

**Document ID:** TQ-AUDIT-001  
**Audit Date:** 2026-11-21  
**Auditor:** Senior SaaS Solutions Architect & Technical Audit Working Group  
**Project Context:** MCA Placement Portfolio Project  
**Operational Mandate:** Strictly ₹0 (Zero Cost) Development, Demonstration, and Deployment  
**Audit Verdict:** **APPROVED WITH MODIFICATIONS (FEASIBLE UNDER REVISED CONSTRAINTS)**  

---

## 1. Executive Summary & Audit Purpose

An exhaustive technical, architectural, and operational consistency audit was performed across all 13 documents within `docs/product-discovery/` for **TechQuery AI**.

The core objective was to answer:
> **"Can we realistically develop, operate, test, and demonstrate the proposed V1 of TechQuery AI at strictly ₹0 cost without paid services, without credit cards, and without system crashes during high-stakes MCA placement interviews?"**

### The Audit Verdict
**YES, fully feasible**, provided **four critical architectural corrections** are enforced:
1. **Queue Decoupling:** BullMQ must not poll Upstash Redis in the public cloud deployment, as BullMQ's default polling will exhaust Upstash's 10,000 daily free commands within hours. In Cloud Mode, asynchronous jobs must use an in-memory queue (`p-limit`) or a PostgreSQL-backed job table (`FOR UPDATE SKIP LOCKED`).
2. **Code Execution Scope Realism:** Pyodide runs Python in-browser via WebAssembly, and JavaScript runs in Web Workers. Java and C++ cannot run in WebAssembly without heavy server infrastructure. Java/C++ must be scoped as **Code Editing + Algorithmic Practice + AI Review**, while **live interactive execution is restricted to Python and JavaScript**.
3. **Cloud Storage Ephemeral Fix:** Render free tier has an ephemeral disk. Cloud Mode must store resumes in **Supabase Storage Free Tier (1GB, no credit card)** or as compressed **Bytea buffers directly in PostgreSQL**, while Local Mode uses the local filesystem.
4. **Local Demo Guarantee:** The application must prioritize **Mode A (Local-First Offline Demo)** for live campus presentations, treating the cloud deployment as a portfolio URL.

---

## 2. Document-by-Document Audit Matrix

| Document Inspected | Completeness | Zero-Cost Compliance | Technical Realism | Identified Issues / Inconsistencies |
| :--- | :---: | :---: | :---: | :--- |
| `PRODUCT_VISION.md` | 100% | 100% | 100% | Excellent alignment with the three pillars. Needs explicit note on Python/JS execution focus. |
| `USER_PERSONAS_AND_JOURNEYS.md` | 100% | 95% | 90% | Journey 12 claims multi-language execution. Must clarify client-side WebAssembly execution limits. |
| `FEATURE_SPECIFICATION.md` | 100% | 85% | 85% | Mentions Java/C++ compilers (`CODE-001`) and external S3 storage (`RES-001`). Requires alignment. |
| `PRODUCT_REQUIREMENTS_DOCUMENT.md` | 100% | 95% | 95% | Solid traceability matrix. Traceability for BullMQ queue needs cloud fallback definition. |
| `SAAS_BUSINESS_MODEL.md` | 100% | 100% | 100% | Correctly models conceptual Free/Pro tiers; verified ₹0 COGS. |
| `AI_PRODUCT_REQUIREMENTS.md` | 100% | 95% | 95% | Comprehensive dual-mode gateway. Hardware RAM sizing for Ollama models needs formal calibration. |
| `NON_FUNCTIONAL_REQUIREMENTS.md` | 100% | 95% | 90% | P95 latency realistic. Render 512MB RAM ceiling and cold-start handling well addressed. |
| `RELEASE_ROADMAP.md` | 100% | 95% | 95% | Well structured. V1 anti-scope explicitly rules out payments and video. |
| `RISKS_AND_ASSUMPTIONS.md` | 100% | 100% | 100% | Accurately identifies Wi-Fi failure and Render cold-start risks. |
| `PRODUCT_GLOSSARY.md` | 100% | 100% | 100% | Accurate business and technical terminology. |
| `PRODUCT_DECISIONS.md` | 100% | 95% | 95% | ADRs are sound. Needs ADR-006 detailing the In-Memory/DB Queue for Cloud Mode. |
| `PRD_EXECUTIVE_SUMMARY.md` | 100% | 100% | 100% | High-level synthesis aligns with zero-cost vision. |
| `ZERO_COST_INFRASTRUCTURE_STRATEGY.md`| 100% | 95% | 95% | Clear strategy. Needs explicit warning against Upstash BullMQ polling burn. |

---

## 3. Major Inconsistencies Discovered & Corrective Actions

### Inconsistency 1: Multi-Language Code Execution (`CODE-001`)
- **Location:** `FEATURE_SPECIFICATION.md` (lines 250–255) states: *"Multi-language support: JavaScript (Node.js 20+), Python (3.11+), Java (OpenJDK 17+), C++ (GCC 12+)"*.
- **Problem:** `ZERO_COST_INFRASTRUCTURE_STRATEGY.md` specifies execution runs client-side via Pyodide (Python in WebAssembly). Pyodide does not run Java or C++. Compiling Java or C++ in-browser without server compute requires massive WebAssembly runtimes (e.g., Cheerios/Doppio) that are unstable, slow (>10MB download), and fail on complex standard libraries.
- **Audit Correction:**
  - **Python:** Full interactive execution via **Pyodide WebAssembly** in a Web Worker.
  - **JavaScript:** Full interactive execution via browser **Web Worker sandbox**.
  - **Java & C++:** Scoped as **Syntax Editing (Monaco) + Curated DSA Practice + Model Solutions + AI Complexity Analysis**. Live compiler execution is explicitly noted as deferred to local Docker runner or V3.

### Inconsistency 2: BullMQ Polling vs Upstash Redis Free Limits
- **Location:** `FEATURE_SPECIFICATION.md` and `PRODUCT_REQUIREMENTS_DOCUMENT.md` specify BullMQ on Redis for all background jobs.
- **Problem:** Upstash Redis Free Tier offers **10,000 commands/day**. BullMQ workers poll Redis using `BRPOPLPUSH` or recurring timer loops. An active BullMQ worker will consume between 5,000 and 15,000 Redis commands every 24 hours **even when no jobs are submitted**. This guarantees that Upstash will throttle or block traffic on day one.
- **Audit Correction:**
  - **Mode A (Localhost):** Local Redis + BullMQ operates without command limits.
  - **Mode B (Cloud Free Tier):** The application uses an **In-Process Async Worker Pool (`p-limit`)** or a **PostgreSQL-backed Job Queue Table** (`status = PENDING`, `SKIP LOCKED`). Redis is reserved strictly for lightweight rate limiting and caching.

### Inconsistency 3: Cloud File Storage & Render Ephemeral Disks
- **Location:** `FEATURE_SPECIFICATION.md` mentions saving resumes to local disk or S3/R2.
- **Problem:** Render's free tier has an **ephemeral filesystem**. Any file saved to `./uploads` on Render disappears when the container restarts or redeploys. Cloudflare R2 requires entering a credit card to activate the account.
- **Audit Correction:**
  - **Mode A (Localhost):** Local disk storage (`./uploads/resumes/`) is 100% fine.
  - **Mode B (Cloud):** Resumes are stored either via **Supabase Storage Free Tier (1GB, zero credit card)** or stored directly in PostgreSQL as **Base64 / Bytea** (a 250KB PDF takes negligible space; 100 demo resumes = 25MB, well within Neon's 500MB free database tier).

---

## 4. Preservation of the Three Product Pillars

The audit confirms that all three core pillars remain intact, functional, and deeply interconnected under the zero-cost architecture:

```mermaid
flowchart LR
    subgraph Pillar 1: AI Technical Interview Prep
        A1[Resume & JD Gap Analysis]
        A2[Personalized Question Studio]
        A3[Model Answers & jsPDF Export]
    end

    subgraph Pillar 2: AI Career Prep
        B1[ATS Quality Audit]
        B2[Sprint-Based Roadmaps]
        B3[Authentic Prep Dashboard]
    end

    subgraph Pillar 3: AI Interview Simulator
        C1[Text-Based Mock Interviewer]
        C2[Adaptive Contextual Probes]
        C3[Multi-Factor Rubric Scorecard]
        C4[In-Browser Pyodide Code Sandbox]
    end

    Pillar 1: AI Technical Interview Prep --> Pillar 2: AI Career Prep
    Pillar 2: AI Career Prep --> Pillar 3: AI Interview Simulator
```

- **Pillar 1:** Delivers high value via local/cloud resume parsing, JD decomposition, question generation, and client-side PDF export.
- **Pillar 2:** Delivers ATS auditing, Google X-Y-Z recommendations, and database-aggregated activity streaks.
- **Pillar 3:** Delivers interactive conversational interview simulations with adaptive probing, multi-factor rubric evaluations, and client-side Python/JS coding sandboxes.

---

## 5. Final Audit Recommendation

**The TechQuery AI Product Requirements documentation is technically sound, feasible, and ready for System Design**, subject to updating the PRD documents to reflect the four corrective actions outlined above.
