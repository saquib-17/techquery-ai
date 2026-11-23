# TechQuery AI — Executive PRD Summary & Next Steps (Zero-Cost Scope)

**Document ID:** TQ-DOC-012  
**Version:** 2.0.0 (Zero-Cost Rebuild)  
**Status:** Approved for Founder & Academic Review  
**Author:** Lead Product Architect & Consulting Group  

---

## 1. Executive Narrative & Project Mission

**TechQuery AI** is an intelligent career acceleration, technical interview preparation, and conversational interview simulation platform. Originally conceived as an academic prototype, it is being completely re-engineered into an elite, production-grade SaaS application designed to demonstrate mastery of full-stack engineering, AI integration, and scalable system design during **MCA placements**.

### The Non-Negotiable Core Mandate: ₹0 Zero-Cost Operation
The entire platform is engineered to develop, operate, demonstrate, and deploy at **strictly ₹0 cost**:
- **Zero Paid AI APIs:** Powered by **Local Ollama** (`llama3.2:3b`, `qwen2.5:7b`) for unlimited, offline local demos, and **Groq Cloud Free Tier** (`llama-3.1-8b-instant`) for online deployment.
- **Zero Paid Hosting:** Deployed on permanent free tiers (**Vercel** for frontend, **Render** for backend API, **Neon/Supabase** for PostgreSQL).
- **Zero Paid Execution Engines:** Coding practice executed client-side via **Pyodide (WebAssembly)** inside an isolated browser Web Worker.
- **Zero Paid Billing Gateways:** Multi-tenant Free and Pro tiers are managed internally via relational schema flags with an interactive demo toggle.

---

## 2. The Three Unified Product Pillars (Zero-Cost Calibrated)

```mermaid
flowchart TD
    subgraph Candidate Graph
        CG[Candidate Profile: Skills, Projects, Resume, Target Roles]
    end

    subgraph Pillar 1: AI Technical Interview Preparation
        P1[Open-Source PDF/DOCX Resume Parsing]
        P2[JD Decomposition & Skill Gap Analysis]
        P3[Difficulty-Calibrated Question Synthesis]
        P4[Structured Model Answers & jsPDF Export]
    end

    subgraph Pillar 2: AI Career Preparation
        C1[ATS Resume Quality Audit]
        C2[Missing Skill Discovery]
        C3[Sprint-Based Milestone Roadmaps]
        C4[Real Database Activity Streaks]
    end

    subgraph Pillar 3: AI Interview Simulation
        S1[Interactive Text-Based Mock Interviews]
        S2[Adaptive Contextual Follow-Up Probing]
        S3[Multi-Factor Rubric Evaluation Scorecard]
        S4[In-Browser Pyodide Code Sandbox]
    end

    CG --> Pillar 1: AI Technical Interview Preparation
    CG --> Pillar 2: AI Career Preparation
    CG --> Pillar 3: AI Interview Simulation
```

---

## 3. The 13 Documentation Deliverables

The complete product discovery documentation package has been compiled inside [`docs/product-discovery/`](file:///f:/techquery-ai-main/docs/product-discovery/):

1. [`ZERO_COST_INFRASTRUCTURE_STRATEGY.md`](file:///f:/techquery-ai-main/docs/product-discovery/ZERO_COST_INFRASTRUCTURE_STRATEGY.md) — Comprehensive technical blueprint for ₹0 development, local Ollama execution, and free cloud deployments.
2. [`PRODUCT_VISION.md`](file:///f:/techquery-ai-main/docs/product-discovery/PRODUCT_VISION.md) — Strategic vision, mission, tri-pillar unified strategy, and core architectural principles.
3. [`USER_PERSONAS_AND_JOURNEYS.md`](file:///f:/techquery-ai-main/docs/product-discovery/USER_PERSONAS_AND_JOURNEYS.md) — 6 detailed candidate personas and 14 end-to-end user workflows with step-by-step failure modes.
4. [`FEATURE_SPECIFICATION.md`](file:///f:/techquery-ai-main/docs/product-discovery/FEATURE_SPECIFICATION.md) — Deep module-by-module breakdown across all 15 system modules with inputs, outputs, rules, and acceptance criteria.
5. [`PRODUCT_REQUIREMENTS_DOCUMENT.md`](file:///f:/techquery-ai-main/docs/product-discovery/PRODUCT_REQUIREMENTS_DOCUMENT.md) — Master PRD, Requirements Traceability Matrix, KPIs, and system boundaries.
6. [`SAAS_BUSINESS_MODEL.md`](file:///f:/techquery-ai-main/docs/product-discovery/SAAS_BUSINESS_MODEL.md) — Conceptual Free and Pro product tiers, zero-cost unit economics, and rate-limiting safeguards.
7. [`AI_PRODUCT_REQUIREMENTS.md`](file:///f:/techquery-ai-main/docs/product-discovery/AI_PRODUCT_REQUIREMENTS.md) — Dual-Engine AI Gateway (Ollama + Groq Free), Zod schema enforcement, and fallback circuit breaking.
8. [`NON_FUNCTIONAL_REQUIREMENTS.md`](file:///f:/techquery-ai-main/docs/product-discovery/NON_FUNCTIONAL_REQUIREMENTS.md) — Latency budgets, 512MB RAM optimization, cold-start handling, and DPDP Act 2023 compliance.
9. [`RELEASE_ROADMAP.md`](file:///f:/techquery-ai-main/docs/product-discovery/RELEASE_ROADMAP.md) — V1 Foundation, V2 Simulator, and V3 In-Browser Mastery releases, Definitions of Done, and explicit V1 Anti-Scope.
10. [`RISKS_AND_ASSUMPTIONS.md`](file:///f:/techquery-ai-main/docs/product-discovery/RISKS_AND_ASSUMPTIONS.md) — Risk probability/impact matrix, zero-cost mitigation playbooks, and open questions.
11. [`PRODUCT_GLOSSARY.md`](file:///f:/techquery-ai-main/docs/product-discovery/PRODUCT_GLOSSARY.md) — Standardized domain, recruitment, AI engineering, and technical terms.
12. [`PRODUCT_DECISIONS.md`](file:///f:/techquery-ai-main/docs/product-discovery/PRODUCT_DECISIONS.md) — 5 Architecture Decision Records (ADRs) and strategic decisions requiring founder sign-off.
13. [`PRD_EXECUTIVE_SUMMARY.md`](file:///f:/techquery-ai-main/docs/product-discovery/PRD_EXECUTIVE_SUMMARY.md) — High-level executive synthesis, strategic differentiators, and next phase transition plan.

---

## 4. Recommended Next Phase

> **Phase 2: SYSTEM DESIGN AND TECHNICAL ARCHITECTURE**

Following your review and formal sign-off on this zero-cost PRD package, the engineering team will begin the technical design phase:
1. **Prisma Relational Schema:** Defining the complete PostgreSQL data model supporting both local and cloud databases.
2. **AI Gateway Contracts:** Implementing TypeScript interfaces for Ollama (`localhost:11434`) and Groq Cloud Free Tier.
3. **OpenAPI 3.1 Specification:** Specifying all REST endpoints for Auth, Resume, Match, and Question Studio.
4. **Pyodide WebAssembly Runner Prototype:** Formulating the client-side Web Worker code execution script.
